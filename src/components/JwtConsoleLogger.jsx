import React, { useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';

const JwtConsoleLogger = () => {
    const { getToken, isSignedIn, userId } = useAuth();
    const { user } = useUser();

    useEffect(() => {
        const handleToken = async () => {
            if (isSignedIn) {
                try {
                    const token = await getToken();
                    window.jwt = token;
                    window.getJwt = () => token;
                    window.copyJwt = () => {
                        if (navigator.clipboard) {
                            navigator.clipboard.writeText(token);
                            console.log('%c✅ JWT Copied to Clipboard!', 'color: #10b981; font-weight: bold; font-size: 14px;');
                        }
                        return token;
                    };

                    console.log(
                        '%c🔑 CLERK JWT TOKEN FOR BACKEND (Bearer Token) 🔑',
                        'background: #ff5722; color: white; font-weight: bold; padding: 4px 8px; border-radius: 4px; font-size: 13px;'
                    );
                    console.log('%cToken:', 'color: #3b82f6; font-weight: bold;', token);
                    console.log('%cAuthorization Header:', 'color: #10b981; font-weight: bold;', `Bearer ${token}`);
                    console.log('%cUser ID:', 'color: #8b5cf6;', userId);
                    console.log('%cTip: Run copyJwt() in console or use window.jwt to quickly access it.', 'color: #6b7280; font-style: italic;');

                    // Auto-copy to clipboard
                    if (navigator.clipboard && document.hasFocus()) {
                        navigator.clipboard.writeText(token).catch(() => {});
                    }
                } catch (err) {
                    console.error('[Clerk JWT Logger Error]:', err);
                }
            } else {
                console.log('%c🔒 [Clerk Auth]: User is not signed in. Sign in to generate JWT.', 'color: #f59e0b; font-weight: bold;');
            }
        };

        handleToken();
    }, [isSignedIn, getToken, userId, user]);

    return null;
};

export default JwtConsoleLogger;
