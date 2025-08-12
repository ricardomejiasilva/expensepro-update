// api.ts
import {
    Account,
    ApiResponse,
    ExpenseCategory,
    ExpensePCard,
    Notification,
    ReceiptTransaction,
} from 'models/types';
import { type FullReceipt, type IUploadReceiptDataObject } from 'models/fullReceipt';
import { IOcrReceipt } from 'models/ocr';
import { generateFormDataFromImageString } from './uploadUtils';
import { BASE_URL } from './constants';
import { isDayjs, type Dayjs } from 'dayjs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { handleLogout, clearAuthData } from './authUtils';
import * as Sentry from '@sentry/react-native';

// appendBinaryDataBody function lifted from ExpensePro web app
// https://tfs.clarkinc.biz/DefaultCollection/ExpensePro/_git/ExpensePro?path=/src/ExpensePro/ClientApp/src/utilities/ApiClient.ts
const appendBinaryDataBody = <T extends object>(
    data: FormData,
    obj: T,
    prefix = '',
    dateOnlyKeys: (keyof T)[] = []
) => {
    Object.keys(obj).forEach((key) => {
        const value = obj[key as keyof typeof obj];
        const keyName = `${prefix}.${key}`;
        if (value && typeof value !== 'function') {
            if (Array.isArray(value)) {
                (value as []).forEach((item) => data.append(`${keyName}`, JSON.stringify(item)));
            } else if (typeof value === 'object') {
                if (isDayjs(value)) {
                    if (dateOnlyKeys.includes(key as keyof T)) {
                        data.append(keyName, (value as Dayjs).format('YYYY-MM-DD'));
                    } else {
                        data.append(keyName, (value as Dayjs).toISOString());
                    }
                } else {
                    appendBinaryDataBody(data, value, `${keyName}.`);
                }
            } else {
                data.append(keyName, value as string);
            }
        }
    });
};

// Get cookie from storage
const getCookieFromStorage = async (): Promise<string | null> => {
    try {
        const cookieHeader = await AsyncStorage.getItem('cookieHeader');
        return cookieHeader || null;
    } catch (error) {
        console.error('Failed to retrieve cookie from storage:', error);
        return null;
    }
};

const fetchApi = async <T>(
    endpoint: string,
    params: Record<string, any> = {},
    options: RequestInit = {}
): Promise<ApiResponse<T>> => {
    const urlParams = new URLSearchParams(params).toString();
    const fullUrl = `${BASE_URL}/${endpoint}${urlParams && `?${urlParams}`}`;
    const captureContext = {
        extra: { fullUrl, endpoint, params, options }, // Don't include sensitive data
    };
    try {
        const requestInit: RequestInit = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
            },
        };
        // Make the fetch request
        const response = await fetch(fullUrl, requestInit);
        // Check the response status
        await checkStatus(response);
        // Parse the response data
        const data = await response.json();
        // Return the data
        return { data, status: response.status };
    } catch (error: any) {
        // Handle fetch errors
        if (typeof Sentry !== 'undefined' && Sentry.captureException) {
            Sentry.captureException(error, captureContext);
        }
        const errorResponse = error instanceof Response ? await error.text() : error.toString();
        console.error('Fetch failed:', errorResponse, captureContext);
        return { error: errorResponse, status: 500 };
    }
};

const postApi = async <T, U>(
    endpoint: string,
    body: U,
    headers?: Record<string, string>,
    method: 'POST' = 'POST'
): Promise<ApiResponse<T>> => {
    const fullUrl = `${BASE_URL}/${endpoint}`;
    const captureContext = {
        extra: { fullUrl, endpoint, body, method }, // Don't include sensitive data
    };
    try {
        const requestInit: RequestInit = {
            method,
            headers: { 'Content-Type': 'application/json', ...headers },
            body: body instanceof FormData ? body : JSON.stringify(body),
        };
        const response = await fetch(fullUrl, requestInit);
        await checkStatus(response);
        const data = await response.json();
        return { data, status: response.status };
    } catch (error: any) {
        // Handle post errors
        if (typeof Sentry !== 'undefined' && Sentry.captureException) {
            Sentry.captureException(error, captureContext);
        }
        const errorResponse = error.toString();
        console.error('Post failed:', errorResponse, captureContext);
        return { error: errorResponse, status: 500 };
    }
};

const authenticatedPostApi = async <T, U>(
    endpoint: string,
    body: U,
    additionalHeaders?: Record<string, string>
): Promise<ApiResponse<T>> => {
    try {
        const cookieHeader = await getCookieFromStorage();

        if (!cookieHeader) {
            return { error: 'Authentication cookie not found', status: 401 };
        }

        const headers = {
            'Content-Type': 'application/json',
            Cookie: cookieHeader,
            Accept: 'application/json',
            ...additionalHeaders,
        };

        return postApi<T, U>(endpoint, body, headers);
    } catch (error) {
        return { error: 'Failed to retrieve auth cookie', status: 500 };
    }
};

const checkStatus = async (response: Response) => {
    if (response.status === 401) {
        let errorMessage = 'Unauthorized, please login again.';
        clearAuthData();
        throw new Error(errorMessage);
    }
    if (!response.ok) {
        const contentType = response.headers.get('Content-Type');
        let errorMessage = 'Network response was not ok';
        if (contentType && contentType.includes('text/html')) {
            errorMessage = await response.text();
        } else if (contentType && contentType.includes('application/json')) {
            const errorJson = await response.json();
            errorMessage = errorJson.message || JSON.stringify(errorJson);
        }
        throw new Error(errorMessage);
    }
    return response;
};

export const addNotification = async (notification: {
    receiptId: number;
    type: string;
    employeeId: number;
}): Promise<ApiResponse<Notification>> => {
    return authenticatedPostApi<Notification, typeof notification>(
        'api/Notification/AddNotification',
        notification
    );
};

export const attachExistingReceipt = async (
    transactionId: number,
    receiptId: number
): Promise<ApiResponse<ReceiptTransaction>> => {
    return authenticatedPostApi<ReceiptTransaction, { transactionId: number; receiptId: number }>(
        'api/Receipt/AttachExistingReceipt',
        { transactionId, receiptId }
    );
};

export const checkUser = async () => {
    return fetchApi<Account>('api/User/checkUser');
};

export const fetchExpenseCategories = async () => {
    return fetchApi<ExpenseCategory[]>('api/receipt/GetExpenseCategories');
};

export const fetchExpenseProCardholders = async () => {
    return fetchApi<ExpensePCard[]>('api/user/GetAllExpenseProCardholders');
};

export const fetchCardholderActivePeriodInformation = async (cardholderId: number) => {
    const params: Record<string, any> = { cardholderId };
    return fetchApi<any>('api/Receipt/GetCardholderActivePeriodInformation', params);
};

export const fetchReceiptNotifications = async () => {
    return fetchApi<Notification[]>('api/Notification/GetNotifications');
};

export const fetchReceiptTransactions = async (cardholderId: number, sinceDays?: number) => {
    const params: Record<string, any> = { cardholderId };
    if (sinceDays) {
        params.sinceDays = sinceDays;
    }
    return fetchApi<ReceiptTransaction[]>('api/receipt/GetReceiptTransactions', params);
};

export const readReceiptNotifications = async (
    ids: number[]
): Promise<ApiResponse<Notification[]>> => {
    const cookieHeader = await getCookieFromStorage();

    if (!cookieHeader) {
        return { error: 'Authentication cookie not found', status: 401 };
    }

    const fullUrl = `${BASE_URL}/api/Notification/ReadNotifications`;

    try {
        const response = await fetch(fullUrl, {
            method: 'POST',
            headers: {
                Cookie: cookieHeader,
                Accept: '*/*',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ids }),
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Mark-as-read failed: ${text}`);
        }

        const contentLength = response.headers.get('content-length');
        const data = contentLength && parseInt(contentLength) > 0 ? await response.json() : null;

        return { data, status: response.status };
    } catch (error: any) {
        console.error('Failed to mark notifications as read:', error);
        return { error: error.toString(), status: 500 };
    }
};

export const uploadFullReceipt = async (
    receiptImage: string | null,
    receiptData: IUploadReceiptDataObject,
    transactionId?: number,
    uploadSource?: number
): Promise<ApiResponse<FullReceipt>> => {
    const formData = await generateFormDataFromImageString(receiptImage);
    // Append receiptData to formData
    appendBinaryDataBody(formData, receiptData, 'Receipt', ['purchaseDate']);

    if (transactionId) {
        formData.append('TransactionId', transactionId.toString());
    }

    if (uploadSource !== undefined) {
        formData.append('UploadSource', uploadSource.toString());
    }

    try {
        const response = await postApi<FullReceipt, FormData>(
            'api/receipt/UploadFullReceipt',
            formData,
            {
                Accept: 'text/plain',
                'Content-Type': 'multipart/form-data',
            }
        );

        return response;
    } catch (error: any) {
        return { error: error.toString(), status: 500 };
    }
};

export const uploadReceiptSearch = async (image: any): Promise<ApiResponse<IOcrReceipt>> => {
    const formData = await generateFormDataFromImageString(image);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
        return await postApi<IOcrReceipt, FormData>('api/receipt/UploadReceiptSearch', formData, {
            Accept: 'text/plain',
            'Content-Type': 'multipart/form-data',
        });
    } catch (error: any) {
        if (error.name === 'AbortError') {
            return { error: 'Request timed out', status: 408 };
        }
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
};

export const activatePushToken = async (pushToken: string): Promise<ApiResponse<any>> => {
    return authenticatedPostApi<any, { pushToken: string }>('api/User/ActivatePushToken', {
        pushToken,
    });
};
