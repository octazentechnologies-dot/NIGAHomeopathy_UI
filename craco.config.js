/**
 * CRA/@svgr rejects SVG namespace attributes (e.g. xmlns:v) used by some CKEditor icons.
 * CRA source-map-loader also tries to load CKEditor "src" files from published source maps,
 * which are not shipped in npm packages and break the compile.
 */
module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      const normalize = (value) => String(value || "").replace(/\\/g, "/");

      const collectLoaders = (rule) => {
        const loaders = [];
        if (rule.loader) loaders.push(rule.loader);
        const uses = Array.isArray(rule.use) ? rule.use : rule.use ? [rule.use] : [];
        uses.forEach((use) => {
          if (typeof use === "string") loaders.push(use);
          else if (use && use.loader) loaders.push(use.loader);
        });
        return loaders;
      };

      const visit = (rules = []) => {
        rules.forEach((rule) => {
          if (rule.oneOf) visit(rule.oneOf);

          const loaders = collectLoaders(rule).map(normalize);

          if (loaders.some((loader) => loader.includes("@svgr/webpack"))) {
            const uses = Array.isArray(rule.use) ? rule.use : rule.use ? [rule.use] : [];
            uses.forEach((use) => {
              if (use && typeof use === "object" && normalize(use.loader).includes("@svgr/webpack")) {
                use.options = {
                  ...(use.options || {}),
                  throwIfNamespace: false,
                };
              }
            });
            if (rule.loader && normalize(rule.loader).includes("@svgr/webpack")) {
              rule.options = {
                ...(rule.options || {}),
                throwIfNamespace: false,
              };
            }
          }

          if (loaders.some((loader) => loader.includes("source-map-loader"))) {
            const previous = Array.isArray(rule.exclude)
              ? rule.exclude
              : rule.exclude
                ? [rule.exclude]
                : [];
            rule.exclude = [
              ...previous,
              /node_modules[\\/]@ckeditor[\\/]/,
              /node_modules[\\/]ckeditor5[\\/]/,
            ];
          }
        });
      };

      visit(webpackConfig.module.rules);
      return webpackConfig;
    },
  },
};
