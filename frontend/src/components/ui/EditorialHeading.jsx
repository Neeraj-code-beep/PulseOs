import React from 'react';

export const EditorialHeading = ({
  as = 'h2',
  children,
  subtitle,
  className = '',
  size = 'md',
}) => {
  const sizes = {
    sm: 'text-xl sm:text-2xl font-bold tracking-tight',
    md: 'text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight',
    lg: 'text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.1]',
    hero: 'text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08]',
  };

  const headingElement = React.createElement(
    as,
    { className: `${sizes[size]} text-[var(--text-primary)] ${className}` },
    children
  );

  return (
    <div className="flex flex-col gap-1.5">
      {headingElement}
      {subtitle && (
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed max-w-2xl font-sans font-normal">
          {subtitle}
        </p>
      )}
    </div>
  );
};
