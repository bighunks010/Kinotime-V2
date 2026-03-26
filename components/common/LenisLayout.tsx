"use client";

import { ReactLenis } from "@studio-freight/react-lenis";

const LenisLayout = ({ children }: { children: React.ReactNode }) => {
  const lenisOptions = {
    lerp: 0.1,
    duration: 1.1,
  };
  return (
    <ReactLenis root options={lenisOptions}>
      {children}
    </ReactLenis>
  );
};

export default LenisLayout;
