yoink() {
  #################################################################
  # Yoink: Copy “human” source files from the current directory
  # into your clipboard.
  #
  # Criteria:
  #   - If inside a Git repository, use the repository’s ignore rules
  #     (by traversing upward to find a .git folder and .gitignore).
  #   - In any case, ignore any dotfiles (files or directories whose names
  #     begin with a dot).
  #   - Also, ignore image files (e.g. *.jpg, *.png, etc.).
  #   - Process only text files (skip binaries).
  #   - Process only files with all of:
  #         • no more than a set number of lines (default: 2000;
  #           override with OINK_MAX_LINES)
  #         • no line longer than a set number of characters (default: 1000;
  #           override with OINK_MAX_LINE_LENGTH)
  #         • an estimated token count not exceeding a maximum
  #           (default: 3333 tokens; override with OINK_MAX_FILE_TOKENS or pass
  #           the maximum as an argument, e.g. `yoink 2000`)
  #
  # After gathering the files, the concatenated contents are copied to your
  # clipboard. A final summary is printed showing:
  #   - The total estimated token count on the clipboard,
  #   - Whether it fits within a 128k-token context window,
  #   - And the top 5 files by estimated token count (largest first).
  #
  # Token estimation is based on an average token length in bytes (default: 4;
  # override with OINK_AVG_TOKEN_LENGTH).
  #
  # A progress bar is shown while scanning.
  #################################################################

  # Check for clipboard tool (using pbcopy)
  if ! command -v pbcopy &>/dev/null; then
    echo "Error: pbcopy not found. Please install it or modify this script for your OS."
    return 1
  fi

  # Parameters:
  local -i max_lines=${OINK_MAX_LINES:-2000}              # maximum lines per file
  local -i max_line_length=${OINK_MAX_LINE_LENGTH:-1000}    # maximum characters per line
  local -i avg_token_length=${OINK_AVG_TOKEN_LENGTH:-4}     # average bytes per token
  local -i max_file_tokens=${OINK_MAX_FILE_TOKENS:-3333}    # max tokens allowed per file
  if [ $# -ge 1 ]; then
    max_file_tokens=$1
  fi

  # Create temporary files for content and for accepted file info.
  local tmpfile accepted_tokens_file
  tmpfile=$(mktemp "/tmp/yoink.XXXXXX") || { echo "Failed to create temporary file"; return 1; }
  accepted_tokens_file=$(mktemp "/tmp/yoink_tokens.XXXXXX") || { echo "Failed to create temporary file for accepted file info"; return 1; }

  # We'll also track the total included size (in bytes) for overall token estimation.
  local -i total_included_size=0

  echo "Scanning for source files..."

  # Build the list of candidate files.
  local -a files=()
  local git_root
  git_root=$(git rev-parse --show-toplevel 2>/dev/null)
  if [ -n "$git_root" ]; then
    # In a Git repository—get tracked and untracked (but not ignored) files.
    while IFS= read -r -d '' file; do
      # Exclude dotfiles even if tracked.
      if [[ $(basename "$file") == .* ]]; then
        continue
      fi
      files+=("$file")
    done < <(git ls-files -z --exclude-standard --others --cached)
  else
    # Not in a Git repo. Use find, ignoring any file whose path contains a '/.'
    while IFS= read -r -d '' file; do
      files+=("$file")
    done < <(find . -type f -not -path '*/.*' -print0)
  fi

  local total_files=${#files[@]}
  echo "Found $total_files candidate file(s)."

  # Define a simple progress bar function.
  progress_bar() {
    local progress=$1
    local total=$2
    local width=40  # width of the bar
    local percent=$(( progress * 100 / total ))
    local filled=$(( progress * width / total ))
    local empty=$(( width - filled ))
    local bar="["
    for (( i=0; i<filled; i++ )); do bar+="#"; done
    for (( i=0; i<empty; i++ )); do bar+="-"; done
    bar+="] ${percent}% (${progress}/${total})"
    printf "\r%s" "$bar"
  }

  # Process each candidate file.
  local -i included_count=0
  local index=0
  for file in "${files[@]}"; do
    ((index++))
    progress_bar "$index" "$total_files"

    # Skip image files by extension.
    case "$file" in
      *.jpg|*.jpeg|*.png|*.gif|*.webp|*.bmp|*.tiff|*.svg)
        continue ;;
    esac

    # Skip non-text files.
    if ! grep -Iq . "$file"; then
      continue
    fi

    # Skip if the file has too many lines.
    local line_count
    line_count=$(wc -l < "$file")
    if (( line_count > max_lines )); then
      continue
    fi

    # Skip file if any line is too long.
    if ! awk -v threshold="$max_line_length" 'length > threshold { exit 1 } END { exit 0 }' "$file"; then
      continue
    fi

    # Get the file's size in bytes.
    local file_size
    if [[ "$(uname)" == "Darwin" ]]; then
      file_size=$(stat -f%z "$file")
    else
      file_size=$(stat -c%s "$file")
    fi

    # Compute estimated tokens for this file.
    local file_estimated_tokens=$(( file_size / avg_token_length ))
    if (( file_estimated_tokens > max_file_tokens )); then
      continue
    fi

    # Append file header and contents to the main output.
    {
      echo "=== $file ==="
      cat "$file"
      echo  # extra newline for separation
    } >> "$tmpfile"

    # Record the file's token count for later reporting.
    echo "$file_estimated_tokens	$file" >> "$accepted_tokens_file"

    total_included_size=$(( total_included_size + file_size ))
    ((included_count++))
  done
  printf "\n"

  # Copy the concatenated content to the clipboard.
  pbcopy < "$tmpfile"
  rm -f "$tmpfile"

  # Compute the total estimated tokens on the clipboard.
  local estimated_total_tokens=$(( total_included_size / avg_token_length ))
  local context_limit=128000
  local context_status
  if (( estimated_total_tokens <= context_limit )); then
    context_status="✅ (fits)"
  else
    context_status="❌ (exceeds)"
  fi

  # Print the final summary.
  echo "Copied content from $included_count file(s) to the clipboard."
  echo "Total estimated tokens on clipboard: $estimated_total_tokens tokens (using ~${avg_token_length} bytes/token)."
  echo "Context window (128k tokens): $context_status"
  echo ""
  echo "Top 5 files by estimated token count (largest first):"
  if [ -s "$accepted_tokens_file" ]; then
    sort -nr "$accepted_tokens_file" | head -n 5 | while IFS=$'\t' read -r tokens file; do
      printf "   %s: %d tokens\n" "$file" "$tokens"
    done
  else
    echo "   (No files met the criteria.)"
  fi

  rm -f "$accepted_tokens_file"
}