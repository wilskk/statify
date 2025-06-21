import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import Page from './page'

describe('Landing Page', () => {
  it('renders a heading', () => {
    render(<Page />)

    const heading = screen.getByRole('heading', {
      name: /Stat/i,
    })

    expect(heading).toBeInTheDocument()
  })
}) 