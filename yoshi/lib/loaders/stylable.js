'use strict';

module.exports = () => {
  const stylableLoaderOptions = {
    standalone: true
  };

  return {
    client: [
      {
        test: /\.st.css$/,
        loader: 'stylable-integration/webpack',
        options: stylableLoaderOptions
      }
    ],
    specs: {
      test: /\.st.css$/,
      use: [
        {
          loader: 'stylable-integration/webpack',
          options: stylableLoaderOptions
        }
      ]
    }
  };
};
