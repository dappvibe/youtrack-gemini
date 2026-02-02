import {defineConfig} from "vitest/config";

export default defineConfig({
  test: {
    testTimeout: 3600000,
    hookTimeout: 3600000
  },
})
