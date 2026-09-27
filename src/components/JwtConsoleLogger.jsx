import React, { useEffect } from 'react';
import { useAuth, useClerk } from '@clerk/clerk-react';

const JwtConsoleLogger = () => {
    const { getToken, isSignedIn, isLoaded } = useAuth();
    const clerk = useClerk();

    useEffect(() => {
        if (!isLoaded) return;

        window.openSignIn = () => clerk.openSignIn();

        const logJwt = async () => {
            if (isSignedIn) {
                try {
                    const token = await getToken();
                    if (token) {
                        console.log(`Bearer ${token}`);
                        window.jwt = token;
                    }
                } catch (err) {
                    console.error('Failed to get JWT:', err);
                }
            } else {
                console.log('🔒 You are not signed in. Please click Sign In (or run openSignIn() in console) to get your Bearer token.');
            }
        };

        logJwt();
    }, [isSignedIn, isLoaded, getToken, clerk]);

    return null;
};

export default JwtConsoleLogger;


