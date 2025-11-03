import React from 'react';

export default function KnowledgeBase({ knowledge }) {
  return (
    <section className="mt-10">
      <h2 className="text-2xl font-semibold mb-4">Learned Answers</h2>
      {knowledge.length === 0 ? (
        <p>No learned answers yet.</p>
      ) : (
        <ul className="list-disc list-inside space-y-2">
          {knowledge.map(({ question, answer }, idx) => (
            <li key={idx}>
              <strong>{question}</strong>: {answer}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
