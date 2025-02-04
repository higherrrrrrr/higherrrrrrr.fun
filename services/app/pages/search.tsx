import TokenSearch from '../components/TokenSearch';

export default function SearchPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-green-500 mb-8">
        Search Tokens
      </h1>
      <TokenSearch />
    </div>
  );
} 