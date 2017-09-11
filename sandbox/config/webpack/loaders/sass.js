const ExtractTextPlugin = require('extract-text-webpack-plugin')
const { env } = require('../configuration.js')

module.exports = {
  test: /\.(scss|sass|css)$/i,
  use: ExtractTextPlugin.extract({
    fallback: 'style-loader',
    use: [
      { loader: "css-loader",
        options: {
          modules: true,
          sourceMap: true,
          localIdentName: env.NODE_ENV === 'production' ? "[hash:base64:5]" : "[local]_[hash:base64:5]",
          minimize: env.NODE_ENV === 'production'
        }
      },
      { loader: "postcss-loader",
        options: {
          sourceMap: true,
          plugins: () => [
            require("autoprefixer")({
              query: {
                browsers: "last 2 version"
              }
            })
          ] 
        }
      },
      'resolve-url-loader',
      { loader: 'sass-loader', options: { sourceMap: true } }
    ]
  })
}
