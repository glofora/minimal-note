/**
 * Ambient type shims for Next.js App Router and Google APIs.
 * In a Next.js project with `googleapis` installed, these types are resolved
 * directly by the respective npm packages.
 */

declare module 'next/server' {
  export class NextRequest extends Request {
    readonly nextUrl: URL;
    readonly cookies: any;
  }

  export class NextResponse extends Response {
    static json<T = any>(body: T, init?: ResponseInit): NextResponse;
    static redirect(url: string | URL, status?: number): NextResponse;
  }
}

declare module 'googleapis' {
  export namespace drive_v3 {
    export interface Drive {
      files: {
        list(params: any): Promise<{ data: { files?: Array<{ id: string; name: string; modifiedTime?: string; size?: string }> } }>;
        get(params: any): Promise<{ data: any }>;
        create(params: any): Promise<{ data: { id: string; name: string; modifiedTime?: string; size?: string } }>;
        update(params: any): Promise<{ data: { id: string; name: string; modifiedTime?: string; size?: string } }>;
        delete(params: any): Promise<any>;
      };
    }
  }

  export namespace google {
    export namespace auth {
      export class OAuth2 {
        constructor(clientId?: string, clientSecret?: string, redirectUri?: string);
        generateAuthUrl(opts: {
          access_type: string;
          scope: string[] | string;
          prompt?: string;
          state?: string;
          include_granted_scopes?: boolean;
        }): string;
        getToken(code: string): Promise<{ tokens: { access_token?: string; refresh_token?: string; expiry_date?: number } }>;
        setCredentials(tokens: { access_token?: string; refresh_token?: string }): void;
      }
    }
    export function drive(opts: { version: 'v3'; auth: any }): drive_v3.Drive;
    export function oauth2(opts: { version: 'v2'; auth: any }): {
      userinfo: {
        get(): Promise<{ data: { email?: string; id?: string } }>;
      };
    };
  }
}
