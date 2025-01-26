// pages/featured/feed.js

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import featuredProjects from '../../data/featuredProjects';

export default function FeaturedFeed() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    // Sort projects by ascending launch date
    const sorted = [...featuredProjects].sort(
      (a, b) => new Date(a.launchDate) - new Date(b.launchDate)
    );
    setProjects(sorted);
  }, []);

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <h1 className="text-3xl font-bold mb-8">Featured Projects</h1>

        <div className="grid gap-6">
          {projects.map((project) => {
            const now = new Date();
            const launchDate = new Date(project.launchDate);
            const isLaunched = launchDate <= now;
            const timeInfo = isLaunched
              ? 'Launched'
              : formatDistanceToNow(launchDate, { addSuffix: true });

            return (
              <div key={project.slug} className="border border-green-500/30 rounded-lg p-4">
                <div className="flex items-start gap-4">
                  {project.imageUrl && (
                    <img
                      src={project.imageUrl}
                      alt={project.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div>
                    <h2 className="text-xl font-bold">{project.name}</h2>
                    <p className="text-sm text-green-500/70">
                      {project.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-green-500/70">
                    <span className="mr-2">Launch:</span>
                    {timeInfo}
                  </div>
                  <Link
                    href={`/featured/${project.slug}`}
                    className="px-3 py-1 border border-green-500 text-green-500 hover:bg-green-500/10 rounded text-sm transition-colors"
                  >
                    View
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
