import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

describe('App', () => {
  it('should render the main heading', () => {
    render(<App />)
    const heading = screen.getByRole('heading', { name: /vite \+ react/i })
    expect(heading).toBeInTheDocument()
  })

  it('should render Vite logo with correct link', () => {
    render(<App />)
    const viteLink = screen.getByRole('link', { name: /vite logo/i })
    expect(viteLink).toBeInTheDocument()
    expect(viteLink).toHaveAttribute('href', 'https://vite.dev')
    expect(viteLink).toHaveAttribute('target', '_blank')
  })

  it('should render React logo with correct link', () => {
    render(<App />)
    const reactLink = screen.getByRole('link', { name: /react logo/i })
    expect(reactLink).toBeInTheDocument()
    expect(reactLink).toHaveAttribute('href', 'https://react.dev')
    expect(reactLink).toHaveAttribute('target', '_blank')
  })

  it('should render the count button with initial value of 0', () => {
    render(<App />)
    const button = screen.getByRole('button', { name: /count is 0/i })
    expect(button).toBeInTheDocument()
  })

  it('should increment count when button is clicked', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    const button = screen.getByRole('button', { name: /count is 0/i })
    expect(button).toBeInTheDocument()

    await user.click(button)
    expect(screen.getByRole('button', { name: /count is 1/i })).toBeInTheDocument()

    await user.click(button)
    expect(screen.getByRole('button', { name: /count is 2/i })).toBeInTheDocument()
  })

  it('should render the instruction text', () => {
    render(<App />)
    // The text is split across elements, so we use a more flexible matcher
    const instructionText = screen.getByText((content, element) => {
      return element?.textContent === 'Edit src/App.tsx and save to test HMR'
    })
    expect(instructionText).toBeInTheDocument()
  })

  it('should render the read the docs text', () => {
    render(<App />)
    const docsText = screen.getByText(/click on the vite and react logos to learn more/i)
    expect(docsText).toBeInTheDocument()
  })

  it('should increment count multiple times correctly', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    const button = screen.getByRole('button', { name: /count is 0/i })
    
    // Click multiple times
    await user.click(button)
    await user.click(button)
    await user.click(button)
    
    expect(screen.getByRole('button', { name: /count is 3/i })).toBeInTheDocument()
  })
})
