vi.mock('~/server/auth/', () => ({
    auth: vi.fn().mockResolvedValue(null), 
}));