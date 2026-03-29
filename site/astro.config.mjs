// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://dotnet-skills-hub.github.io',
  base: '/',
  output: 'static',
  trailingSlash: 'always',
  build: {
    assets: 'assets'
  }
});
