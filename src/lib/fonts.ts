import localFont from "next/font/local";
import { Noto_Sans_KR } from "next/font/google";

export const neoDGM = localFont({
  src: [
    { path: "/fonts/neodgm.woff2", weight: "400", style: "normal" }
  ],
  display: "swap",
  variable: "--font-neodgm"
});

export const notoSans = Noto_Sans_KR({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-noto"
});
