import { Link } from 'gatsby'
import PropTypes from 'prop-types'
import React from 'react'
import styled from '@emotion/styled'

const HeaderContainer = styled.header`
  margin-bottom: 1.45rem;
  background-color: black;
`

const TitleContainer = styled.div`
  margin: 0 auto;
  max-width: 1200px;
  padding: 1.45rem 1.0875rem;
`

const Title = styled.h1`
  margin: 0;
`

const TitleLink = styled(Link)`
  color: white;
  text-decoration: none;
  &:visited {
    color: white;
  }
`

const Header = ({ siteTitle }) => (
  <HeaderContainer>
    <TitleContainer>
      <Title>
        <TitleLink to="/">{siteTitle}</TitleLink>
      </Title>
    </TitleContainer>
  </HeaderContainer>
)

Header.propTypes = {
  siteTitle: PropTypes.string,
}

Header.defaultProps = {
  siteTitle: ``,
}

export default Header
