/**
 * Layout component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import React from 'react'
import PropTypes from 'prop-types'
import { useStaticQuery, graphql } from 'gatsby'

import Header from './header'
import './layout.css'
import styled from '@emotion/styled'

const ContentContainer = styled.div`
  margin: 0 auto;
  max-width: 1200px;
  padding: 0 1.0875rem 1.45rem;
  padding-top: 0;
`

const Main = styled.main`
  /* height: calc(100vh - 200px); */
`

const Layout = ({ children }) => {
  const data = useStaticQuery(graphql`
    query SiteTitleQuery {
      site {
        siteMetadata {
          title
        }
      }
    }
  `)

  return (
    <>
      <Header siteTitle={data.site.siteMetadata.title} />
      <ContentContainer>
        <Main>{children}</Main>
        <footer>
          © Alex Anthony {new Date().getFullYear()}, Built with
          {` `}
          <a href="https://www.gatsbyjs.org">Gatsby</a>
        </footer>
      </ContentContainer>
    </>
  )
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
}

export default Layout
