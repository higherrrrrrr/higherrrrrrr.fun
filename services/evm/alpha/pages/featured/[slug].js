// pages/featured/[slug].js

import { useRouter } from 'next/router';
import featuredProjects from '../../data/featuredProjects';

export default function FeaturedProjectPage() {
  const router = useRouter();
  const { slug } = router.query;

  // Find the matching project by slug:
  const project = featuredProjects.find((p) => p.slug === slug);

  if (!project) {
    return (
      <div className="min-h-screen bg-black text-green-500 font-mono flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Project Not Found</h1>
          <p className="text-green-500/60 mt-2">
            This project may have been removed or does not exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Title & Description */}
        <h1 className="text-3xl font-bold mb-4">{project.name}</h1>
        <p className="text-green-500/70">{project.description}</p>

        {/* Image */}
        {project.imageUrl && (
          <img
            src={project.imageUrl}
            alt={project.name}
            className="mt-6 w-full max-w-md object-cover rounded border border-green-500/30"
          />
        )}

        {/* Socials / Links */}
        <div className="mt-6 space-y-3">
          <div>
            <span className="text-green-500/70 mr-2">Website:</span>
            {project.website ? (
              <a
                href={project.website}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-green-400"
              >
                {project.website}
              </a>
            ) : (
              <span>N/A</span>
            )}
          </div>

          <div>
            <span className="text-green-500/70 mr-2">Twitter:</span>
            {project.twitter ? (
              <a
                href={project.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-green-400"
              >
                {project.twitter}
              </a>
            ) : (
              <span>N/A</span>
            )}
          </div>
        </div>

        {/* Custom content (HTML or Markdown) */}
        {project.customContent && (
          <div
            className="mt-8 text-green-500/80 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: project.customContent }}
          />
        )}
      </div>
    </div>
  );
}
