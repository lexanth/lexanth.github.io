import React from 'react'
import { graphql, Link } from 'gatsby'

import Layout from '../components/layout'
import SEO from '../components/seo'
import styled from '@emotion/styled'
import { keyframes } from '@emotion/core'

const appear = keyframes`
  from {
    transform: scale(0);
  }
  to {
    transform: scale(1);
  }
`

const BlogPostsContainer = styled.section`
  margin-bottom: 30px;
  display: flex;
  flex-wrap: wrap;
  &::after {
    content: '';
    flex: auto;
  }
`

const BlogIntroContainer = styled.article`
  flex: 0 0 calc(100% - 30px);
  @media only screen and (min-width: 768px) {
    flex: 0 0 calc(50% - 30px);
  }
  margin: 15px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  background-color: #f3f2f1;
  color: #0b0c0c;
  animation: ${appear} 1s;
  animation-fill-mode: both;
`

const BlogIntro = ({ blogPost }) => {
  return (
    <BlogIntroContainer>
      <Link to={blogPost.fields.slug}>

      <h3>{blogPost.frontmatter.title}</h3>
    </Link>
      <p>{blogPost.frontmatter.excerpt}</p>
      <p>{blogPost.frontmatter.date}</p>
    </BlogIntroContainer>
  )
}

const BlogPage = ({ data }) => {
  return (
    <Layout>
      <SEO title="Blog" />
      <BlogPostsContainer>
        {data.blogPosts.edges.map(blogPost => (
          <BlogIntro key={blogPost.node.id} blogPost={blogPost.node} />
        ))}
      </BlogPostsContainer>
    </Layout>
  )
}

export default BlogPage

export const query = graphql`
  {
    blogPosts: allMarkdownRemark(
      filter: { fileAbsolutePath: { regex: "/(blog)/" } }
      sort: { order: DESC, fields: [frontmatter___date] }
    ) {
      edges {
        node {
          id
          frontmatter {
            title
            date(formatString: "D MMMM YYYY")
            excerpt
          }
          fields {
            slug
          }
        }
      }
    }
  }
`
