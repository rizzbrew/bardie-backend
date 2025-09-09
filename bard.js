const axios = require("axios");
const http = require("http");
const https = require("https");
const config = require("./config.json");

class Bard {
  constructor(timeout = 10000) {
    this.timeout = timeout;
    this.cookie = null;

    this.session = axios.create({
      timeout: this.timeout,
      httpAgent: new http.Agent({ keepAlive: true, rejectUnauthorized: false }),
      httpsAgent: new https.Agent({
        keepAlive: true,
        rejectUnauthorized: false,
      }),
    });

    this.params = {
      bl: config.bl,
      _reqid: String(Number(Math.random().toString().slice(2, 8))),
      rt: "c",
    };

    this.data = { "f.req": "", at: "" };
    this.bard =
      "https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate";
  }

  getHeaders() {
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    };
    if (this.cookie) headers.Cookie = this.cookie;
    return headers;
  }

  async configure(cookie) {
    this.cookie = "__Secure-1PSID=" + cookie;
    this.session.defaults.headers = {
      ...this.getHeaders(),
      Host: "gemini.google.com",
      "X-Same-Domain": "1",
      "Sec-Fetch-Site": "same-origin",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Dest": "empty",
      "Sec-CH-UA":
        '"Not A(Brand";v="99", "Chromium";v="118", "Google Chrome";v="118"',
      "Sec-CH-UA-Mobile": "?0",
      "Sec-CH-UA-Platform": '"Windows"',
      Accept: "*/*",
      "Accept-Language": "en-US,en;q=0.9",
      "Cache-Control": "no-cache",
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      Origin: "https://gemini.google.com",
      Referer: "https://gemini.google.com/",
    };
    await this.setSnim0e();
  }

  async initial(message, imageInput = null) {
    try {
      if (!message) return { content: "Input message!", status: false };
      if (!this.data.at)
        return { content: "[Bard Error]: Authentication Error", status: false };

      const messageStruct = [[message], null, [null, null, null]];

      if (imageInput) {
        const imagesArray = Array.isArray(imageInput)
          ? imageInput
          : [imageInput];

        if (imagesArray.length > config.imageUploadLimit) {
          return {
            status: false,
            content: "You can only upload up to ${config.imageUploadLimit} images",
          };
        }

        const imagesPayload = [];
        for (const img of imagesArray) {
          const { location, name, contentType, status, content } =
            await this.uploadImage(img);
          if (!status) return { content, status };

          imagesPayload.push([[location, 1, null, contentType], name]);
        }

        messageStruct[0].push(0, null, imagesPayload);
      }

      this.data["f.req"] = JSON.stringify([
        null,
        JSON.stringify(messageStruct),
      ]);

      const response = await this.session.post(
        this.bard,
        new URLSearchParams(this.data).toString(),
        { params: this.params, timeout: 120000 },
      );

      const splitIndex = imageInput ? 7 : 3;
      const chatData = JSON.parse(response.data.split("\n")[splitIndex])[0][2];

      if (chatData === null)
        return {
          content: "[Bard Error]: Null Request, Try Again Later",
          status: false,
        };

      const chatDataParsed = JSON.parse(chatData);
      const rawString = JSON.stringify(chatDataParsed);
      const imageRegex =
        /(https:\/\/lh3\.googleusercontent\.com\/(?!gg\/)[a-zA-Z0-9\-\._~:\/?#\[\]@!$&'()*+,;=%]+)/;
      const match = rawString.match(imageRegex);

      if (match && match[0]) {
        const directUrl = await this.resolveGoogleImage(match[0]);
        return { content: directUrl, status: true };
      } else {
        const answerRoot = chatDataParsed?.[4];
      if (!answerRoot || !answerRoot[0]) {
        return {
        content: "[Bard Error]: Failed To Parse Text, Try Again Later",
        status: false,
        };
      }
        const answer = answerRoot[0];
        const text = answer[1][0];
        const images =
          answer[4]?.map((x) => ({ tag: x[2], url: x[3][0][0] })) ?? [];

        return { content: text, images, status: true };
      }
    } catch (error) {
      console.error(error);
      return {
        content: `[Bard Error]: ${
          error.code === "ECONNRESET" ? "Could not fetch Bard." : error.message
        }`,
        status: false,
      };
    }
  }

  async resolveGoogleImage(url, maxHops = 10) {
    let currentUrl = url;
    for (let i = 0; i < maxHops; i++) {
      const resp = await axios.head(currentUrl, {
        maxRedirects: 0,
        validateStatus: (s) => s === 302 || s === 200,
        headers: {
          accept:
            "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          referer: "https://gemini.google.com/",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          cookie: this.cookie,
        },
      });

      if (resp.status === 200) {
        if (resp.headers["content-type"]?.startsWith("image/")) {
          return currentUrl;
        }
        throw new Error("Not an image file");
      }

      if (resp.status === 302) {
        const next = resp.headers.location;
        if (!next) throw new Error("Redirect without location header");
        currentUrl = next;
        continue;
      }
    }
    throw new Error("Too many redirects, image not resolved");
  }

  async uploadImage(input) {
    try {
      let buffer, contentType, name;

      if (Buffer.isBuffer(input)) {
        buffer = input;
        contentType = "image/jpeg";
        name = "RizzyFuzz Uploader" + Date.now() + ".jpg";
      } else if (/^https?:\/\//.test(input)) {
        const { data, headers, request } = await axios.get(input, {
          responseType: "arraybuffer",
        });
        buffer = Buffer.from(data);
        contentType = headers["content-type"] || "image/jpeg";
        name = "RizzyFuzz Uploader" + Date.now() + ".jpg";
      } else {
        buffer = Buffer.from(input, "base64");
        contentType = "image/jpeg";
        name = "RizzyFuzz Uploader" + Date.now() + ".jpg";
      }

      const validImageTypes = [
        "image/png",
        "image/jpg",
        "image/webp",
      ];
      if (!validImageTypes.includes(contentType)) {
        return { content: "[Bard Error]: Invalid image type", status: false };
      }

      const size = buffer.length;
      const params = [
        `${encodeURIComponent("File name")}=${encodeURIComponent([name])}`,
      ];

      const response = await axios.post(
        "https://content-push.googleapis.com/upload/",
        params,
        {
          headers: {
            "X-Goog-Upload-Command": "start",
            "X-Goog-Upload-Protocol": "resumable",
            "X-Goog-Upload-Header-Content-Length": size,
            "X-Tenant-Id": "bard-storage",
            "Push-Id": "feeds/mcudyrk2a4khkz",
          },
        },
      );

      const uploadUrl = response.headers["x-goog-upload-url"];
      const imageResponse = await axios.post(uploadUrl, buffer, {
        headers: {
          "X-Goog-Upload-Command": "upload, finalize",
          "X-Goog-Upload-Offset": 0,
          "X-Tenant-Id": "bard-storage",
        },
      });

      return { location: imageResponse.data, name, contentType, status: true };
    } catch (error) {
      console.error(error);
      return { content: "[Bard Error]: Failed to upload photo", status: false };
    }
  }

  async setSnim0e() {
    try {
      const response = await this.session.get("https://gemini.google.com/", {
        timeout: this.timeout,
      });
      if (response.status !== 200)
        return { content: "Failed to connect to server" };
      const regex = /SNlM0e":"(.*?)"/;
      const match = response.data.match(regex);
      if (match) this.data.at = match[1];
      else
        return {
          content: "[Bard Error]: Failed to retrieve SNlM0e",
          status: false,
        };
    } catch (error) {
      console.error(error);
    }
  }
}

module.exports = Bard;