import React from 'react'
import { connect } from 'react-redux';
import { compose } from 'redux';
import Link from 'next/link';
import Router from 'next/router';
import { List } from 'immutable';
import url from 'url';
import { RadioGroup, Radio } from 'react-radio-group';

import app from '../components/App';
import { load } from '../redux/articleList';

export default compose(
  app((dispatch, {query}) => dispatch(load(query))),
  connect(({articleList}, {query: { articleId }}) => {
    const firstCursorOfPage = articleList.getIn(['edges', 0, 'cursor']);
    const lastCursorOfPage = articleList.getIn(['edges', -1, 'cursor']);

    return {
      isLoading: articleList.getIn(['state', 'isLoading']),
      articles: (articleList.get('edges') || List()).map(edge => edge.get('node')),
      isFirstPage: articleList.get('firstCursor') === firstCursorOfPage,
      isLastPage: articleList.get('lastCursor') === lastCursorOfPage,
      firstCursorOfPage,
      lastCursorOfPage,
      totalCount: articleList.get('totalCount'),
    };
  }, (dispatch, {query}) => ({
    handleOrderByChange(e) {
      Router.push(`/${url.format({query: {
        ...query,
        orderBy: e.target.value,
        before: undefined,
        after: undefined,
      }})}`);
    },
    handleFilterChange(value) {
      Router.push(`/${url.format({query: {
        ...query,
        filter: value,
        before: undefined,
        after: undefined,
      }})}`);
    },
  }),
))(function Index({
  isLoading = false,
  articles = null,
  isFirstPage,
  isLastPage,
  query,
  firstCursorOfPage,
  lastCursorOfPage,
  totalCount,

  handleOrderByChange,
  handleFilterChange,
}) {
  if(isLoading && articles === null) {
    return <div>Loading...</div>
  }

  return (
    <div>
      Order By:
      <select onChange={handleOrderByChange} value={query.orderBy || 'replyRequestCount'}>
        <option value="replyRequestCount">Most asked</option>
        <option value="createdAt">Most recently asked</option>
        <option value="updatedAt">Latest updated</option>
      </select>

      <RadioGroup
        onChange={handleFilterChange}
        selectedValue={query.filter || 'all'}
        Component="ul"
      >
        <li><label><Radio value="all" />All</label></li>
        <li><label><Radio value="unsolved" />Not replied yet</label></li>
        <li><label><Radio value="solved" />Replied</label></li>
      </RadioGroup>

      <p>{totalCount} articles</p>
      <ol>
        {
          articles.map(article => (
            <li key={article.get('id')}>
              {/*
                We make the URL to look like `/article/articleId` but actually sends to index.js here.
                In this way that we can add show modal dialog overlaying the current list view..
                See: https://github.com/zeit/next.js/blob/master/examples/parameterized-routing/pages/index.js
              */}
              <Link href={`/article/?id=${article.get('id')}`} as={`/article/${article.get('id')}`}>
                <a><pre>{JSON.stringify(article.toJS(), null, '  ')}</pre></a>
              </Link>
            </li>
          ))
        }
      </ol>
      {isLoading ? <p>Loading in background...</p> : ''}
      <p>
        {isFirstPage ? '' : <Link href={url.format({query: {...query, before: firstCursorOfPage, after: undefined}})}><a>Prev</a></Link>}
        {isLastPage ? '' : <Link href={url.format({query: {...query, after: lastCursorOfPage, before: undefined}})}><a>Next</a></Link>}
      </p>

      <style jsx>{`
        .modal {
          color: red;
        }
      `}</style>
    </div>
  );
})
