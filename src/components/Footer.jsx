import React, { memo } from 'react';

const Footer = memo(({ authorName, githubUrl }) => (
  <footer className="footer">
    <div>
      <p>Powered by TensorFlow.js & Transformers.js.</p>
    </div>
    <div>
      Create by <a href={githubUrl} target="_blank" rel="noopener noreferrer">{authorName}</a>
    </div>
  </footer>
));

Footer.displayName = 'Footer';
export default Footer;