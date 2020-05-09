import { Link } from 'gatsby'
import PropTypes from 'prop-types'
import React from 'react'
import styled from '@emotion/styled'

const HeaderContainer = styled.header`
  margin-bottom: 1.45rem;
  background-color: black;
  height: 100px;
`

const Nav = styled.nav`
  margin: 0 auto;
  max-width: 1200px;
  padding: 1.45rem 1.0875rem;
  display: flex;
  align-items: center;
  & > * {
    margin: 0 1rem;
  }
`

const HeaderLink = styled(Link)`
  color: white;
  text-decoration: none;
  &:visited {
    color: white;
  }
  &.active {
    color: #6496eb;
  }
`

const Header = ({ siteTitle }) => (
  <HeaderContainer>
    <Nav>
      <h1>
        <HeaderLink to="/">{siteTitle}</HeaderLink>
      </h1>
      <h3>
        <HeaderLink  activeClassName="active" to="/">Projects</HeaderLink>
      </h3>
      <h3>
        <HeaderLink  activeClassName="active" to="/blog">Blog</HeaderLink>
      </h3>
    </Nav>
  </HeaderContainer>
)

Header.propTypes = {
  siteTitle: PropTypes.string,
}

Header.defaultProps = {
  siteTitle: ``,
}

export default Header
