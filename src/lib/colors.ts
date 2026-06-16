import tailwindConfig from '../../tailwind.config';

type ColorsMap = { [key: string]: string | ColorsMap };

function resolveColor(colors: ColorsMap, path: string): string | undefined {
  const parts = path.split('.');
  let current: string | ColorsMap = colors;

  for (const part of parts) {
    if (typeof current === 'object' && current !== null) {
      current = current[part];
    } else {
      return undefined;
    }
  }

  return typeof current === 'string' ? current : undefined;
}

export function getThemeColor(colorPath: string): string {
  const colors = tailwindConfig.theme?.extend?.colors as ColorsMap | undefined;
  if (!colors) return '#000000'; // Fallback
  return resolveColor(colors, colorPath) || '#000000';
}

export function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return `rgba(0, 0, 0, ${alpha})`;
  }
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
