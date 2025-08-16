const nextConfig = {
    async headers() {
      return [
        {
          source: "/(.*)",
          headers: [
            {
              key: "Content-Security-Policy",
              value: `
                default-src 'self';
                script-src 'self' https://js.stripe.com;
                connect-src 'self' https://api.stripe.com https://ip-api.com;
                img-src 'self' data: https:;
                style-src 'self' 'unsafe-inline';
                font-src 'self' data:;
                frame-src 'self' https://js.stripe.com;
                object-src 'none';
                base-uri 'self';
                form-action 'self';
              `.replace(/\s{2,}/g, ' ').trim()
            }
          ]
        }
      ];
    }
  };