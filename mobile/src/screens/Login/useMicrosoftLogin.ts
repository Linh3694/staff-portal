import { useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001';

const discovery = {
    authorizationEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
};

export const useMicrosoftLogin = (onSuccess: (token: string) => void) => {
    const redirectUri = makeRedirectUri({
        scheme: 'staffportal',
    });

    const [request, response, promptAsync] = useAuthRequest(
        {
            clientId: 'CLIENT_ID_MICROSOFT', // Thay bằng clientId thật
            scopes: ['openid', 'profile', 'email'],
            redirectUri,
            responseType: 'token', // hoặc 'code' nếu backend xử lý code
        },
        discovery
    );

    useEffect(() => {
        if (response?.type === 'success') {
            // Lấy token từ response.params.access_token hoặc response.params.code
            const token = response.params.access_token || response.params.code;
            if (token) onSuccess(token);
        }
    }, [response]);

    return { request, promptAsync };
}; 