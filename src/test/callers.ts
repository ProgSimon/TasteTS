import { createCaller } from "~/server/api/root";
import { db } from "~/server/db";
import type { Session } from 'next-auth'

const ownerSession: Session = { 
    user: {
        id: "alice-1",
        name: 'Alice',
        email: 'alice@test.com'
    },
    expires: "9999-12-31"
}

const otherSession: Session = { 
    user: {
        id: "eve-2",
        name: 'Eve',
        email: 'eve@test.com'
    },
    expires: "9999-12-31"
}


// Legitimate user
export const protCallerOwner = createCaller({ 
    db,
    session: ownerSession,
    headers: new Headers()
})


// Malicious actor
export const protCallerOther = createCaller({ 
    db,
    session: otherSession,
    headers: new Headers()
})


// Unauthenticated user
export const pubCaller = createCaller({ 
    db,
    session: null,
    headers: new Headers()
})
