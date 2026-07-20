import { Product, Transaction, User } from '../types';

export function getSpreadsheetId(): string {
  const url = localStorage.getItem('gas_spreadsheet_url') || '';
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : '';
}

export function getWebAppUrl(): string {
  return localStorage.getItem('gas_web_app_url') || '';
}

export function isConfigured(): boolean {
  return getWebAppUrl().trim() !== '';
}

async function apiRequest<T>(action: string, payload?: any): Promise<T | null> {
  const url = getWebAppUrl().trim();
  if (!url) return null;

  const sheetId = getSpreadsheetId();

  try {
    if (payload) {
      // POST request
      try {
        const corsResponse = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain',
          },
          body: JSON.stringify({ action, data: payload, spreadsheetId: sheetId })
        });
        if (corsResponse.ok) {
          const result = await corsResponse.json();
          return result;
        } else {
          throw new Error('Response not ok');
        }
      } catch (corsErr) {
        // If CORS or response fails, we can still fire and forget using no-cors so the server still receives and processes it!
        await fetch(url, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'text/plain',
          },
          body: JSON.stringify({ action, data: payload, spreadsheetId: sheetId })
        });
        return { success: true, message: 'ส่งข้อมูลลงชีตสำเร็จแล้ว (Fire-and-forget mode)' } as any;
      }
    } else {
      // GET request
      const separator = url.includes('?') ? '&' : '?';
      const response = await fetch(`${url}${separator}action=${action}&spreadsheetId=${sheetId}`);
      if (response.ok) {
        const result = await response.json();
        if (result && result.success) {
          return result.data;
        }
      }
    }
  } catch (error) {
    console.error(`Error in GAS API Request [${action}]:`, error);
  }
  return null;
}

export async function fetchLiveProducts(): Promise<Product[] | null> {
  return apiRequest<Product[]>('getProducts');
}

export async function fetchLiveTransactions(): Promise<Transaction[] | null> {
  return apiRequest<Transaction[]>('getTransactions');
}

export async function fetchLiveUsers(): Promise<User[] | null> {
  return apiRequest<User[]>('getUsers');
}

export async function syncIntake(data: any) {
  return apiRequest('processIntake', data);
}

export async function syncWithdraw(data: any) {
  return apiRequest('processWithdraw', data);
}

export async function syncEditProduct(data: any) {
  return apiRequest('editProduct', data);
}

export async function syncDeleteProduct(code: string) {
  return apiRequest('deleteProduct', { code });
}

export async function syncAddUser(user: User) {
  return apiRequest('addUser', user);
}

export async function syncDeleteUser(username: string) {
  return apiRequest('deleteUser', { username });
}

export async function syncUpdateUser(oldUsername: string, user: User) {
  return apiRequest('updateUser', { oldUsername, user });
}

export async function syncSetupDatabase(): Promise<{ success: boolean; message: string } | null> {
  return apiRequest<{ success: boolean; message: string }>('setup', {});
}

