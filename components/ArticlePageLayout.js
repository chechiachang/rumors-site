import { useState } from 'react';
import gql from 'graphql-tag';
import querystring from 'querystring';
import { t, jt } from 'ttag';
import Router, { useRouter } from 'next/router';
import getConfig from 'next/config';
import url from 'url';
import { useQuery } from '@apollo/react-hooks';

import Box from '@material-ui/core/Box';
import Fab from '@material-ui/core/Fab';
import Modal from '@material-ui/core/Modal';
import Backdrop from '@material-ui/core/Backdrop';
import Fade from '@material-ui/core/Fade';
import Typography from '@material-ui/core/Typography';
import CircularProgress from '@material-ui/core/CircularProgress';

import FilterListIcon from '@material-ui/icons/FilterList';
import CloseIcon from '@material-ui/icons/Close';

import { makeStyles } from '@material-ui/core/styles';

import { ellipsis } from 'lib/text';
import * as FILTERS from 'constants/articleFilters';
import ArticleItem from 'components/ArticleItem';
import FeedDisplay from 'components/FeedDisplay';
import Filters, { Filter } from 'components/Filters';
import TimeRange from 'components/TimeRange';
import SortInput from 'components/SortInput';

const DEFAULT_REPLY_REQUEST_COUNT = 1;
const MAX_KEYWORD_LENGTH = 100;

const {
  publicRuntimeConfig: { PUBLIC_URL },
} = getConfig();

const LIST_ARTICLES = gql`
  query ListArticles(
    $filter: ListArticleFilter
    $orderBy: [ListArticleOrderBy]
    $after: String
  ) {
    ListArticles(filter: $filter, orderBy: $orderBy, after: $after, first: 10) {
      edges {
        node {
          ...ArticleItem
        }
        cursor
      }
    }
  }
  ${ArticleItem.fragments.ArticleItem}
`;

const LIST_STAT = gql`
  query ListArticlesStat(
    $filter: ListArticleFilter
    $orderBy: [ListArticleOrderBy]
  ) {
    ListArticles(filter: $filter, orderBy: $orderBy, first: 25) {
      pageInfo {
        firstCursor
        lastCursor
      }
      totalCount
    }
  }
`;

const LIST_CATEGORIES = gql`
  query ListCategories {
    ListCategories(first: 25) {
      totalCount
      edges {
        node {
          id
          title
        }
      }
    }
  }
`;

const useStyles = makeStyles(theme => ({
  filters: {
    padding: '12px 0',
  },
  articleList: {
    padding: 0,
  },
  openFilter: {
    position: 'fixed',
    left: 22,
    bottom: 22,
    backgroundColor: theme.palette.secondary[500],
    color: theme.palette.common.white,
    [theme.breakpoints.up('md')]: {
      display: 'none',
    },
  },
  filtersModal: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  closeIcon: {
    position: 'absolute',
    right: 12,
    top: 20,
    color: theme.palette.secondary[100],
  },
  loadMore: {
    width: '33%',
    color: theme.palette.secondary[300],
    outline: 'none',
    cursor: 'pointer',
    borderRadius: 30,
    padding: 10,
    background: 'transparent',
    border: `1px solid ${theme.palette.secondary[300]}`,
  },
  loading: {
    color: theme.palette.secondary[300],
  },
}));

/**
 * @param {object} urlQuery - URL query object
 * @returns {object} ListArticleFilter
 */
function urlQuery2Filter(
  {
    filters = '',
    q,
    categoryIds = '',
    start,
    end,
    replyRequestCount = DEFAULT_REPLY_REQUEST_COUNT,
    searchUserByArticleId,
  } = {},
  { defaultFilters = [], timeRangeKey = 'createdAt' }
) {
  const splits = filters.split(',');
  const selectedFilters = splits.length && splits[0] ? splits : defaultFilters;

  const filterObj = {};
  if (q) {
    filterObj.moreLikeThis = {
      like: q.slice(0, MAX_KEYWORD_LENGTH),
      minimumShouldMatch: '0',
    };
  }

  filterObj.replyRequestCount = { GTE: replyRequestCount };

  if (categoryIds) {
    filterObj.categoryIds = categoryIds.split(',');
  }

  selectedFilters.forEach(filter => {
    switch (filter) {
      case FILTERS.REPLIED_BY_ME:
        // @todo: fill this when api completes
        break;
      case FILTERS.NO_USEFUL_REPLY_YET:
        filterObj.hasArticleReplyWithMorePositiveFeedback = false;
        break;
      case FILTERS.ASKED_MANY_TIMES:
        filterObj.replyRequestCount = { GTE: 2 };
        break;
      case FILTERS.REPLIED_MANY_TIMES:
        filterObj.replyCount = { GTE: 3 };
        break;
      default:
    }
  });

  if (searchUserByArticleId) {
    filterObj.fromUserOfArticleId = searchUserByArticleId;
  }

  if (start) {
    filterObj[timeRangeKey] = { ...filterObj[timeRangeKey], GTE: start };
  }
  if (end) {
    filterObj[timeRangeKey] = { ...filterObj[timeRangeKey], LTE: end };
  }

  // Return filterObj only when it is populated.
  if (!Object.keys(filterObj).length) {
    return undefined;
  }
  return filterObj;
}

/**
 * @param {object} urlQuery - URL query object
 * @returns {object[]} ListArticleOrderBy array
 */
function urlQuery2OrderBy({ orderBy } = {}, defaultOrder) {
  const key = orderBy || defaultOrder;
  return [{ [key]: 'DESC' }];
}

/**
 * @param {object} urlQuery
 */
function goToUrlQueryAndResetPagination(urlQuery) {
  delete urlQuery.after;
  urlQuery = Object.fromEntries(
    Object.entries(urlQuery).filter(entry => !!entry[1])
  );
  Router.push(`${location.pathname}${url.format({ query: urlQuery })}`);
}

/**
 *
 * @param {object} query
 * @returns {object}
 */
export function getQueryVars(query, option) {
  return {
    filter: urlQuery2Filter(query, {
      defaultFilters: option?.filters,
      timeRangeKey: option?.timeRangeKey,
    }),
    orderBy: urlQuery2OrderBy(query, option?.order),
  };
}

const filterLabelMapping = [
  { value: FILTERS.REPLIED_BY_ME, label: t`Replied by me` },
  { value: FILTERS.NO_USEFUL_REPLY_YET, label: t`No useful reply yet` },
  { value: FILTERS.ASKED_MANY_TIMES, label: t`Asked many times` },
  { value: FILTERS.REPLIED_MANY_TIMES, label: t`Replied many times` },
];

const FilterGroup = ({
  classes,
  query,
  options,
  categories,
  defaultFilters,
  desktop = false,
}) => (
  <Filters className={classes.filters}>
    {options.filters && (
      <Filter
        title={t`Filter`}
        multiple
        options={filterLabelMapping.map(filter => {
          let selected;
          if (query.filters) {
            selected = query.filters.split(',').includes(filter.value);
          } else {
            selected = defaultFilters.includes(filter.value);
          }
          return { ...filter, selected };
        })}
        onChange={filters =>
          goToUrlQueryAndResetPagination({
            ...query,
            filters: filters.join(','),
          })
        }
        data-ga="Filter(filter)"
      />
    )}

    {/* not implemented yet
    {options.consider && (
      <Filter
        title={t`Consider`}
        multiple
      />
    )}
    */}

    {options.category && (
      <Filter
        title={t`Topic`}
        multiple
        expandable={desktop}
        onlySelected={desktop}
        placeholder={desktop ? t`All Topics` : ''}
        options={categories}
        onChange={selected =>
          goToUrlQueryAndResetPagination({
            ...query,
            categoryIds: selected
              .map(value => encodeURIComponent(value))
              .join(','),
          })
        }
        data-ga="Filter(category)"
      />
    )}
  </Filters>
);

function ArticlePageLayout({
  title,
  articleDisplayConfig = {},
  defaultOrder = 'lastRequestedAt',
  defaultFilters = [],
  timeRangeKey = 'createdAt',
  options = {
    filters: true,
    consider: true,
    category: true,
  },
}) {
  const classes = useStyles();
  const [showFilters, setFiltersShow] = useState(false);

  const { query } = useRouter();

  const listQueryVars = getQueryVars(query, {
    filters: defaultFilters,
    order: defaultOrder,
    timeRangeKey,
  });

  const {
    loading,
    fetchMore,
    data: listArticlesData,
    error: listArticlesError,
  } = useQuery(LIST_ARTICLES, {
    variables: listQueryVars,
  });

  const { data: listCategories } = useQuery(LIST_CATEGORIES);

  // Separate these stats query so that it will be cached by apollo-client and sends no network request
  // on page change, but still works when filter options are updated.
  //
  const { data: listStatData } = useQuery(LIST_STAT, {
    variables: listQueryVars,
  });

  // List data
  const articleEdges = listArticlesData?.ListArticles?.edges || [];
  const statsData = listStatData?.ListArticles || {};

  const lastCursorOfPage =
    articleEdges.length &&
    articleEdges[articleEdges.length - 1] &&
    articleEdges[articleEdges.length - 1].cursor;
  const { lastCursor } = statsData?.pageInfo || {};

  const selectedCategories =
    query.categoryIds?.split(',').map(decodeURIComponent) || [];

  const categories =
    listCategories?.ListCategories?.edges.map(({ node }) => ({
      value: node.id,
      label: node.title,
      selected: selectedCategories.includes(node.id),
    })) || [];

  // Flags
  const searchedArticleEdge = articleEdges.find(
    ({ node: { id } }) => id === query.searchUserByArticleId
  );
  const searchedUserArticleElem = (
    <mark key="searched-user">
      {ellipsis(searchedArticleEdge?.node?.text || '', { wordCount: 15 })}
    </mark>
  );

  const queryString = querystring.stringify(query);
  return (
    <Box pt={2}>
      {query.searchUserByArticleId && (
        <h1>{jt`Messages reported by user that reported “${searchedUserArticleElem}”`}</h1>
      )}

      <Box
        display="flex"
        alignItems="center"
        justifyContent={{ xs: 'center', md: 'space-between' }}
        flexDirection={{ xs: 'column', md: 'row' }}
        mb={2}
      >
        <Typography variant="h4">{title}</Typography>
        <Box my={1}>
          <FeedDisplay
            feedUrl={`${PUBLIC_URL}/api/articles/rss2?${queryString}`}
          />
        </Box>
      </Box>

      <Box display="flex" justifyContent="space-between" flexWrap="wrap">
        <TimeRange
          range={listQueryVars?.filter?.[timeRangeKey]}
          onChange={time =>
            goToUrlQueryAndResetPagination({
              ...query,
              start: time?.GT,
              end: time?.LTE,
            })
          }
        />
        <SortInput
          orderBy={query.orderBy || defaultOrder}
          onChange={orderBy =>
            goToUrlQueryAndResetPagination({ ...query, orderBy })
          }
          options={[
            { value: 'lastRequestedAt', label: t`Most recently asked` },
            { value: 'lastRepliedAt', label: t`Most recently replied` },
            { value: 'replyRequestCount', label: t`Most asked` },
          ]}
        />
      </Box>

      <Box display={['none', 'none', 'block']}>
        <FilterGroup
          options={options}
          categories={categories}
          defaultFilters={defaultFilters}
          classes={classes}
          query={query}
          desktop
        />
      </Box>

      {loading && !articleEdges.length ? (
        t`Loading...`
      ) : listArticlesError ? (
        listArticlesError.toString()
      ) : (
        <>
          <ul className={classes.articleList}>
            {articleEdges.map(({ node }) => (
              <ArticleItem
                key={node.id}
                article={node}
                {...articleDisplayConfig}
              />
            ))}
          </ul>
          {lastCursorOfPage !== lastCursor && (
            <Box display="flex" pb={1.5} justifyContent="center">
              <button
                data-ga="LoadMore"
                type="button"
                className={classes.loadMore}
                onClick={() =>
                  fetchMore({
                    variables: {
                      after: lastCursorOfPage,
                    },
                    updateQuery(prev, { fetchMoreResult }) {
                      if (!fetchMoreResult) return prev;
                      const newArticleData = fetchMoreResult?.ListArticles;
                      return {
                        ...prev,
                        ListArticles: {
                          ...newArticleData,
                          edges: [...articleEdges, ...newArticleData.edges],
                        },
                      };
                    },
                  })
                }
              >
                {loading ? (
                  <CircularProgress
                    size={16}
                    classes={{ root: classes.loading }}
                  />
                ) : (
                  t`Load More`
                )}
              </button>
            </Box>
          )}
        </>
      )}
      <Fab
        variant="extended"
        aria-label="filters"
        data-ga="Mobile filter button"
        className={classes.openFilter}
        onClick={() => setFiltersShow(!showFilters)}
      >
        <FilterListIcon />
        {t`Filter`}
      </Fab>
      <Modal
        aria-labelledby="filters"
        aria-describedby="filters"
        open={showFilters}
        onClose={() => setFiltersShow(false)}
        closeAfterTransition
        className={classes.filtersModal}
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
      >
        <Fade in={showFilters}>
          <Box position="relative">
            <FilterGroup
              data-ga="Mobile filter view"
              options={options}
              categories={categories}
              defaultFilters={defaultFilters}
              classes={classes}
              query={query}
            />
            <CloseIcon
              className={classes.closeIcon}
              onClick={() => setFiltersShow(false)}
            />
          </Box>
        </Fade>
      </Modal>
    </Box>
  );
}

export default ArticlePageLayout;
