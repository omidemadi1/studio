declare module 'next/link' {
  import * as React from 'react';

  type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    as?: string;
    replace?: boolean;
    scroll?: boolean;
    shallow?: boolean;
    passHref?: boolean;
    prefetch?: boolean;
    legacyBehavior?: boolean;
    locale?: string | false;
  };

  const Link: React.FC<LinkProps>;
  export default Link;
}
