import React, { useState } from 'react';
import gql from 'graphql-tag';
import { c, t } from 'ttag';
import NavLink from 'components/NavLink';
import GlobalSearch from './GlobalSearch';
import { makeStyles, withStyles, useTheme } from '@material-ui/core/styles';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  Typography,
  Badge,
} from '@material-ui/core';
import AccountCircleOutlinedIcon from '@material-ui/icons/AccountCircleOutlined';
import ExitToAppRoundedIcon from '@material-ui/icons/ExitToAppRounded';
import InfoIcon from '@material-ui/icons/Info';
import { NAVBAR_HEIGHT, TABS_HEIGHT } from 'constants/size';
import { EDITOR_FACEBOOK_GROUP } from 'constants/urls';
import * as Widgets from './Widgets';
import desktopLogo from './images/logo-desktop.svg';
import mobileLogo from './images/logo-mobile.svg';
import { useQuery } from '@apollo/react-hooks';

const MENU_BUTTON_WIDTH = 48;

const useStyles = makeStyles(theme => ({
  root: {
    position: 'sticky',
    height: NAVBAR_HEIGHT + TABS_HEIGHT,
    top: 0,
    zIndex: 10,
    [theme.breakpoints.up('md')]: {
      height: NAVBAR_HEIGHT,
    },
  },
  flex: {
    display: 'flex',
  },
  top: {
    height: NAVBAR_HEIGHT,
    padding: '0 1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#FFFFFF',
    [theme.breakpoints.up('md')]: {
      padding: '0 2rem',
    },
  },
  logo: {
    width: 100,
    height: 'auto',
    [theme.breakpoints.up('md')]: {
      width: 240,
    },
  },
  tab: {
    padding: 8,
    flex: '1',
    lineHeight: `calc(${TABS_HEIGHT}px - 8px * 2)`,
    textAlign: 'center',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    fontWeight: 500,
    letterSpacing: 0.75,
    color: theme.palette.secondary[300],
    [theme.breakpoints.up('md')]: {
      color: theme.palette.secondary[500],
      padding: '0 18px',
    },
  },
  activeTab: {
    color: theme.palette.secondary[500],
    [theme.breakpoints.up('md')]: {
      color: theme.palette.primary.main,
    },
  },
  menuToggleButton: {
    width: MENU_BUTTON_WIDTH,
    height: TABS_HEIGHT,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: theme.palette.secondary[300],
    color: theme.palette.common.white,
  },
  profileMenu: {
    marginTop: 50,
    backgroundColor: theme.palette.secondary.main,
    color: theme.palette.common.white,
    overflow: 'inherit',
  },
  divider: {
    backgroundColor: theme.palette.secondary[400],
  },
  listIcon: {
    color: theme.palette.secondary[300],
    minWidth: 0,
    paddingRight: 8,
  },
  login: {
    borderRadius: 70,
    border: `1px solid ${theme.palette.secondary[500]}`,
  },
}));

const LIST_UNSOLVED_ARTICLES = gql`
  query ListUnresolvedArticles {
    ListArticles(
      filter: {
        replyRequestCount: { GTE: 2 }
        hasArticleReplyWithMorePositiveFeedback: false
      }
    ) {
      totalCount
    }
  }
`;

const CustomBadge = withStyles(theme => ({
  badge: { backgroundColor: '#FB5959', color: theme.palette.common.white },
}))(Badge);

const Links = ({ classes, unsolvedCount }) => (
  <>
    <NavLink
      href="/articles"
      className={classes.tab}
      activeClassName={classes.activeTab}
    >
      {c('App header').t`Messages`}
    </NavLink>
    <NavLink
      href="/replies"
      className={classes.tab}
      activeClassName={classes.activeTab}
    >
      {c('App header').t`Replies`}
    </NavLink>
    <NavLink
      href="/hoax-for-you"
      className={classes.tab}
      activeClassName={classes.activeTab}
    >
      <CustomBadge
        classes={{ root: classes.badge }}
        badgeContent={unsolvedCount}
        showZero={true}
      >
        {c('App header').t`For You`}
      </CustomBadge>
    </NavLink>
    <Box
      display={['none', 'none', 'inline']}
      component={NavLink}
      external
      href={EDITOR_FACEBOOK_GROUP}
      className={classes.tab}
    >
      {c('App header').t`Forum`}
    </Box>
  </>
);

function AppHeader({ onMenuButtonClick, user, onLoginModalOpen, onLogout }) {
  const [anchor, setAnchor] = useState(null);
  const [displayLogo, setDisplayLogo] = useState(true);
  const classes = useStyles();
  const theme = useTheme();
  const { data } = useQuery(LIST_UNSOLVED_ARTICLES);

  const unsolvedCount = data?.ListArticles?.totalCount;

  const openProfileMenu = e => setAnchor(e.currentTarget);
  const closeProfileMenu = () => setAnchor(null);

  return (
    <header className={classes.root}>
      <div className={classes.top}>
        <div className={classes.flex}>
          {displayLogo && (
            <a href="/">
              <picture>
                <source
                  media={`(min-width: ${theme.breakpoints.values.md}px)`}
                  srcSet={desktopLogo}
                />
                <img className={classes.logo} src={mobileLogo} alt="" />
              </picture>
            </a>
          )}
          <Box display={['none', 'none', 'flex']} fontSize={20} px="10px">
            <Links classes={classes} unsolvedCount={unsolvedCount} />
          </Box>
        </div>
        <GlobalSearch onIconClick={() => setDisplayLogo(false)} />
        <Box display={['none', 'none', 'block']}>
          {user?.name ? (
            <>
              <Widgets.Avatar user={user} size={40} onClick={openProfileMenu} />
              <Menu
                id="profile-menu"
                classes={{ paper: classes.profileMenu }}
                anchorEl={anchor}
                keepMounted
                open={Boolean(anchor)}
                onClose={closeProfileMenu}
              >
                <Widgets.Level user={user} />
                <MenuItem onClick={closeProfileMenu}>
                  <ListItemIcon>
                    <Widgets.Avatar user={user} size={40} />
                  </ListItemIcon>
                  <Typography variant="inherit">{user?.name}</Typography>
                </MenuItem>
                <Divider classes={{ root: classes.divider }} />
                <MenuItem onClick={closeProfileMenu}>
                  <ListItemIcon className={classes.listIcon}>
                    <AccountCircleOutlinedIcon />
                  </ListItemIcon>
                  <Typography variant="inherit">{t`My Profile`}</Typography>
                </MenuItem>
                <Divider classes={{ root: classes.divider }} />
                <MenuItem onClick={closeProfileMenu}>
                  <ListItemIcon className={classes.listIcon}>
                    <InfoIcon />
                  </ListItemIcon>
                  <Typography variant="inherit">{t`About Cofacts`}</Typography>
                </MenuItem>
                <Divider classes={{ root: classes.divider }} />
                <MenuItem onClick={onLogout}>
                  <ListItemIcon className={classes.listIcon}>
                    <ExitToAppRoundedIcon />
                  </ListItemIcon>
                  <Typography variant="inherit">{t`Logout`}</Typography>
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button
              onClick={onLoginModalOpen}
              size="small"
              className={classes.login}
            >{t`Login`}</Button>
          )}
        </Box>
      </div>
      <Box
        display={['flex', 'flex', 'none']}
        height={TABS_HEIGHT}
        css={{ backgroundColor: theme.palette.secondary[50] }}
      >
        <Links classes={classes} unsolvedCount={unsolvedCount} />
        <div className={classes.menuToggleButton} onClick={onMenuButtonClick}>
          <MoreHorizIcon />
        </div>
      </Box>
    </header>
  );
}

export default React.memo(AppHeader);
