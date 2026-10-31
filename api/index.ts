
let app: any;

export default async function handler(req: any, res: any) {
  if (!app) {
    const { createApp } = await import("../apps/api/src/app.js");
    app = createApp();
  }

  return app(req, res);
}
