import React from 'react'
import { graphql } from 'gatsby'

import Layout from '../components/layout'
import SEO from '../components/seo'

const BlogPost = ({ data }) => {
  return (
    <Layout>
      <SEO title={`Blog - ${data.blogPost.frontmatter.title}`} />
      <h2>{data.blogPost.frontmatter.title}</h2>
      <p>{data.blogPost.frontmatter.date}</p>

      <article dangerouslySetInnerHTML={{__html: data.blogPost.html}} />

    </Layout>
  )
}

export default BlogPost

export const query = graphql`
  query($slug: String!) {
    blogPost: markdownRemark(
      fields: { slug: { eq: $slug } }
    ) {
      id
      html
      frontmatter {
        title
        date(formatString: "D MMMM YYYY")
      }
      fields {
        slug
      }
    }
  }
`
