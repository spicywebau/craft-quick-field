const path = require('path')

module.exports = {
  entry: {
    main: path.resolve(__dirname, '../src/scripts/main.ts')
  },
  output: {
    path: path.resolve(__dirname, '../../src/resources/'),
    filename: 'js/[name].js'
  },
  externals: {
    jquery: 'jQuery',
    craft: 'Craft',
    garnish: 'Garnish'
  },
  resolve: {
    extensions: ['.ts', '.tsx']
  },
  module: {
    rules: [
      {
        use: ['ts-loader'],
        include: [path.resolve(__dirname, '../src')],
        test: /\.tsx?$/
      }
    ]
  }
}
