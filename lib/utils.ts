import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 랜덤 테일윈드 배경색 클래스를 생성하는 함수
 * @returns 테일윈드 배경색 클래스 (예: 'bg-red-500')
 */
export function getRandomBgColor(): string {
  // 테일윈드에서 사용 가능한 기본 색상 목록
  const colors = [
    "red",
    "orange",
    "amber",
    "yellow",
    "lime",
    "green",
    "emerald",
    "teal",
    "cyan",
    "sky",
    "blue",
    "indigo",
    "violet",
    "purple",
    "fuchsia",
    "pink",
    "rose",
  ];

  // 테일윈드에서 사용 가능한 색상 강도(shade) 목록
  const shades = [100, 200, 300, 400];

  // 랜덤 색상과 강도 선택
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  const randomShade = shades[Math.floor(Math.random() * shades.length)];

  // 테일윈드 클래스 문자열 반환
  return `bg-${randomColor}-${randomShade}`;
}
