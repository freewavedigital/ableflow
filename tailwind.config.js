/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		fontFamily: {
  			inter: ['var(--font-inter)'],
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  safelist: [
    'bg-blue-50', 'bg-blue-100', 'bg-blue-500', 'text-blue-700', 'text-blue-600', 'border-blue-200',
    'bg-amber-50', 'bg-amber-100', 'bg-amber-500', 'text-amber-700', 'text-amber-600', 'border-amber-200',
    'bg-green-50', 'bg-green-100', 'bg-green-500', 'text-green-700', 'text-green-600', 'border-green-200',
    'bg-red-50', 'bg-red-100', 'bg-red-500', 'text-red-700', 'text-red-600', 'border-red-200',
    'bg-purple-50', 'bg-purple-100', 'bg-purple-500', 'text-purple-700', 'text-purple-600', 'border-purple-200',
    'bg-slate-50', 'bg-slate-100', 'bg-slate-500', 'text-slate-700', 'text-slate-600', 'border-slate-200',
    'bg-cyan-50', 'bg-cyan-100', 'bg-cyan-500', 'text-cyan-700', 'text-cyan-600', 'border-cyan-200',
    'bg-orange-50', 'bg-orange-100', 'bg-orange-500', 'text-orange-700', 'text-orange-600', 'border-orange-200',
    'bg-emerald-50', 'bg-emerald-100', 'bg-emerald-500', 'text-emerald-700', 'text-emerald-600', 'border-emerald-200',
    'bg-rose-50', 'bg-rose-100', 'bg-rose-500', 'text-rose-700', 'text-rose-600', 'border-rose-200',
  ],
  plugins: [require("tailwindcss-animate")],
}