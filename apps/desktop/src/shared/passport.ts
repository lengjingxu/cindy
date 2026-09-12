import type { DataOwnerPushStamp } from './dataOwnerPush';

export interface PassportDictation {
  token: string;
  sessionId: string;
  text: string;
  ownerStamp: DataOwnerPushStamp;
}
export interface PassportState {
  enabled: boolean;
  supported: boolean;
  connected: boolean;
  devices: string[];
  bluetooth: number;
  voice: 'idle' | 'recording' | 'transcribing' | 'draft' | 'error';
}
export interface PassportApi {
  getState(): Promise<PassportState>;
  setEnabled(enabled: boolean | null): Promise<void>;
  connect(id: string): Promise<void>;
  disconnect(): Promise<void>;
  getDictation(sessionId: string): Promise<PassportDictation | null>;
  acknowledgeDictation(token: string): Promise<void>;
}
