"use strict";

const path = require("path");
const fs = require("fs");

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".html":
      return "text/html; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    case ".js":
      return "application/javascript; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".svg":
      return "image/svg+xml";
    default:
      return "text/plain; charset=utf-8";
  }
}

// Expose UI pages under /plugin.whistle.network-tab-demo/ and /whistle.whistle.network-tab-demo/
module.exports.uiServer = (server /* http.Server | Express app */, options) => {
  // Use plugin root as static root; join request paths directly.
  const staticRoot = __dirname;

  function serveFile(res, filePath, statusCode = 200) {
    const type = getContentType(filePath);
    fs.createReadStream(filePath)
      .on("open", () => {
        res.writeHead(statusCode, { "content-type": type });
      })
      .on("error", () => {
        res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
        res.end("Not Found");
      })
      .pipe(res);
  }

  const handler = (req, res, next) => {
    try {
      // In uiServer, req.url is already relative to plugin root
      let rel = req.url || "/";
      if (rel === "/" || rel === "") {
        rel = "/public/res-tab.html";
      }
      const filePath = path.join(staticRoot, rel.replace(/^\//, ""));
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        return serveFile(res, filePath);
      }
      const indexPath = path.join(staticRoot, "public/res-tab.html");
      if (fs.existsSync(indexPath)) {
        return serveFile(res, indexPath);
      }
      if (typeof next === "function") return next();
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("Not Found");
    } catch (e) {
      if (typeof next === "function") return next(e);
      res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
      res.end(String(e && e.stack || e));
    }
  };

  if (typeof server.on === "function") {
    server.on("request", handler);
  }
  if (typeof server.use === "function") {
    server.use(handler);
  }
};


