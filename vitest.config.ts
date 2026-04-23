import { defineConfig } from 'vitest/config'
import dotenv from 'dotenv'
import react from '@vitejs/plugin-react'
import tsconfigpaths from 'vite-tsconfig-paths'

dotenv.config({ path: './.env.test' })

export default defineConfig({
    test: {
        projects: [
            {
                plugins: [tsconfigpaths()],
                
                test: {
                    name: 'backend-tests',
                    include: ['./src/server/**/*.test.ts'],
                    environment: 'node',
                    globals: true,
                    setupFiles: ['./vitest.backend.setup.ts']
                }  
            },
            {
                plugins: [
                    react(),
                    tsconfigpaths()
                ],
                test: {
                    name: 'frontend-tests',
                    include: ['./src/app/**/*.test.tsx'],
                    environment: 'jsdom',
                    globals: true,
                    setupFiles: ['./vitest.frontend.setup.ts']
                }
            }
        ]
    },
})
