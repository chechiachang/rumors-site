import React from 'react'
import { connect } from 'react-redux';
import { compose } from 'redux';
import Link from 'next/link';

import app from '../components/App';
import { load } from '../redux/articleList';
import { load as loadArticle } from '../redux/articleDetail';

export default compose(
  app((dispatch, {query: { articleId }}) => {
    if(articleId) {
      return dispatch(loadArticle(articleId))
    }
    return dispatch(load());
  }),
  connect(({articleList, articleDetail}, {query: { articleId }}) => ({
    isLoading: articleList.getIn(['state', 'isLoading']),
    articleList: articleList.get('data'),
    article: articleId ? articleDetail.get('data') : null,
  })),
)(function Index({
  isLoading = false,
  articleList = null,
  article = null,
}) {
  if(isLoading && articleList === null) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <ol>
        {
          articleList.map(article => (
            <li key={article.get('id')}>
              {/*
                We make the URL to look like `/article/articleId` but actually sends to index.js here.
                In this way that we can add show modal dialog overlaying the current list view..
                See: https://github.com/zeit/next.js/blob/master/examples/parameterized-routing/pages/index.js
              */}
              <Link href={`/?articleId=${article.get('id')}`} as={`/article/${article.get('id')}`}>
                <a><pre>{JSON.stringify(article.toJS(), null, '  ')}</pre></a>
              </Link>
            </li>
          ))
        }
      </ol>
      {isLoading ? <p>Loading in background...</p> : ''}
      {article ? (
        <div className="modal"><h1>This is modal</h1>{JSON.stringify(article.toJS(), null, '  ')}</div>
      ) : ''}

      <style jsx>{`
        .modal {
          color: red;
        }
      `}</style>
    </div>
  );
})