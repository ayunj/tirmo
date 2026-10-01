"use client";

import { useRouter } from "next/navigation";

type Tag = "div" | "span" | "b" | "button" | "section";

/** 목업과 같은 태그를 쓰면서 누르면 이동 (div/span 그대로라 CSS가 맞아요) */
export default function Go({ href, as = "div", replace, back, ...rest }: { href?: string; as?: Tag; replace?: boolean; back?: boolean } & React.HTMLAttributes<HTMLElement>) {
  const router = useRouter();
  const T = as as "div";
  return (
    <T
      {...rest}
      role="link"
      style={{ cursor: "pointer", ...rest.style }}
      onClick={(e) => {
        rest.onClick?.(e);
        if (e.defaultPrevented) return;
        if (back) return router.back();
        if (href) (replace ? router.replace : router.push)(href);
      }}
    />
  );
}
