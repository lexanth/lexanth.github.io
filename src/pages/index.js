import React from 'react'
import { graphql } from 'gatsby'

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

const ProjectContainer = styled.section`
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
  animation-delay: 1s;
`
const ProjectsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  &::after {
    content: '';
    flex: auto;
  }
`
const ProjectImage = styled.img`
  height: 300px;
  object-fit: contain;
`

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`

const SectionTitle = styled.h2`
  animation: ${fadeIn} 0.5s;
  animation-fill-mode: both;
  animation-delay: 0.5s;
`

const ProjectComponent = ({ project }) => (
  <ProjectContainer>
    {project.frontmatter.image && (
      <ProjectImage
        src={project.frontmatter.image.publicURL}
        alt={project.frontmatter.title}
      />
    )}
    <h3>{project.frontmatter.title}</h3>
    <div dangerouslySetInnerHTML={{ __html: project.html }}></div>
  </ProjectContainer>
)

const IndexPage = ({ data }) => {
  return (
    <Layout>
      <SEO title="Home" />
      <SectionTitle>Can it be done in React Web?</SectionTitle>
      <ProjectsContainer>
        {data.canItBeDone.edges.map(page => (
          <ProjectComponent key={page.node.id} project={page.node} />
        ))}
      </ProjectsContainer>

      <SectionTitle>Other Projects</SectionTitle>
      <ProjectsContainer>
        {data.other.edges.map(page => (
          <ProjectComponent key={page.node.id} project={page.node} />
        ))}
      </ProjectsContainer>
    </Layout>
  )
}

export default IndexPage

export const query = graphql`
  {
    canItBeDone: allMarkdownRemark(
      filter: { fileAbsolutePath: { regex: "/(react-web)/" } }
      sort: { order: ASC, fields: [frontmatter___order] }
    ) {
      edges {
        node {
          id
          html
          frontmatter {
            title
            image {
              publicURL
            }
          }
        }
      }
    }

    other: allMarkdownRemark(
      filter: { fileAbsolutePath: { regex: "/(other)/" } }
      sort: { order: ASC, fields: [frontmatter___order] }
    ) {
      edges {
        node {
          id
          html
          frontmatter {
            title
            image {
              publicURL
            }
          }
        }
      }
    }
  }
`
