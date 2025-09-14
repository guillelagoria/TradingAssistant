# Trading UI Components - shadcn/ui Research

## Installation Commands

```bash
# Install all required components at once
npx shadcn@latest add @shadcn/card @shadcn/form @shadcn/input @shadcn/select @shadcn/textarea @shadcn/button @shadcn/label @shadcn/badge @shadcn/separator @shadcn/progress @shadcn/tooltip @shadcn/drawer @shadcn/dialog @shadcn/alert-dialog @shadcn/tabs @shadcn/switch @shadcn/slider @shadcn/calendar @shadcn/popover @shadcn/skeleton @shadcn/chart @shadcn/hover-card @shadcn/command @shadcn/dropdown-menu @shadcn/sheet @shadcn/accordion @shadcn/resizable @shadcn/scroll-area @shadcn/toggle-group @shadcn/alert

# Alternative: Install by category
# Form Enhancement Components
npx shadcn@latest add card form input select textarea button label badge separator
npx shadcn@latest add progress tooltip drawer dialog alert-dialog tabs switch slider
npx shadcn@latest add calendar popover skeleton

# Dashboard Enhancement Components
npx shadcn@latest add chart hover-card command dropdown-menu sheet
npx shadcn@latest add accordion resizable scroll-area toggle-group alert
```

## Core Form Components

### Component: Card
**Dependencies:** None
**Key Props:** className, children
**Best Example:**
```tsx
<Card className="w-[350px]">
  <CardHeader>
    <CardTitle>Create project</CardTitle>
    <CardDescription>Deploy your new project in one-click.</CardDescription>
  </CardHeader>
  <CardContent>
    <form>
      <div className="grid w-full items-center gap-6">
        <div className="flex flex-col gap-3">
          <Label htmlFor="name">Name</Label>
          <Input id="name" placeholder="Name of your project" />
        </div>
      </div>
    </form>
  </CardContent>
  <CardFooter className="flex justify-between">
    <Button variant="outline">Cancel</Button>
    <Button>Deploy</Button>
  </CardFooter>
</Card>
```

### Component: Form
**Dependencies:** @radix-ui/react-label, @radix-ui/react-slot, @hookform/resolvers, zod, react-hook-form
**Key Props:** form control, field validation, onSubmit
**Best Example:**
```tsx
const FormSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
})

export default function InputForm() {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      username: "",
    },
  })

  function onSubmit(data: z.infer<typeof FormSchema>) {
    toast("You submitted the following values", {
      description: (
        <pre className="mt-2 w-[320px] rounded-md bg-neutral-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-2/3 space-y-6">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="shadcn" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
```

### Component: Input
**Dependencies:** None
**Key Props:** type, placeholder, required, value, onChange
**Best Example:** See Form example above

### Component: Select
**Dependencies:** @radix-ui/react-select
**Key Props:** onValueChange, defaultValue, placeholder
**Best Example:**
```tsx
<FormField
  control={form.control}
  name="email"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Email</FormLabel>
      <Select onValueChange={field.onChange} defaultValue={field.value}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Select a verified email to display" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="m@example.com">m@example.com</SelectItem>
          <SelectItem value="m@google.com">m@google.com</SelectItem>
          <SelectItem value="m@support.com">m@support.com</SelectItem>
        </SelectContent>
      </Select>
      <FormDescription>
        You can manage email addresses in your email settings.
      </FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Component: Textarea
**Dependencies:** None
**Key Props:** placeholder, className, resize behavior
**Best Example:**
```tsx
<FormField
  control={form.control}
  name="bio"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Bio</FormLabel>
      <FormControl>
        <Textarea
          placeholder="Tell us a little bit about yourself"
          className="resize-none"
          {...field}
        />
      </FormControl>
      <FormDescription>
        You can <span>@mention</span> other users and organizations.
      </FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Component: Button
**Dependencies:** @radix-ui/react-slot
**Key Props:** variant (default, destructive, outline, secondary, ghost, link), size (default, sm, lg, icon)

### Component: Label
**Dependencies:** @radix-ui/react-label
**Key Props:** htmlFor, className

### Component: Badge
**Dependencies:** @radix-ui/react-slot
**Key Props:** variant (default, secondary, destructive, outline)

### Component: Separator
**Dependencies:** @radix-ui/react-separator
**Key Props:** orientation (horizontal, vertical), className

## Advanced UX Components

### Component: Progress
**Dependencies:** @radix-ui/react-progress
**Key Props:** value, max, className
**Best Example:**
```tsx
export default function ProgressDemo() {
  const [progress, setProgress] = React.useState(13)

  React.useEffect(() => {
    const timer = setTimeout(() => setProgress(66), 500)
    return () => clearTimeout(timer)
  }, [])

  return <Progress value={progress} className="w-[60%]" />
}
```

### Component: Tooltip
**Dependencies:** @radix-ui/react-tooltip
**Key Props:** content, side (top, right, bottom, left), align

### Component: Drawer
**Dependencies:** vaul, @radix-ui/react-dialog
**Key Props:** open, onOpenChange, shouldScaleBackground
**Best Example:**
```tsx
export default function DrawerDemo() {
  const [goal, setGoal] = React.useState(350)

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">Open Drawer</Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Move Goal</DrawerTitle>
            <DrawerDescription>Set your daily activity goal.</DrawerDescription>
          </DrawerHeader>
          <div className="p-4 pb-0">
            <div className="flex items-center justify-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0 rounded-full"
                onClick={() => onClick(-10)}
                disabled={goal <= 200}
              >
                <Minus />
              </Button>
              <div className="flex-1 text-center">
                <div className="text-7xl font-bold tracking-tighter">
                  {goal}
                </div>
                <div className="text-muted-foreground text-[0.70rem] uppercase">
                  Calories/day
                </div>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0 rounded-full"
                onClick={() => onClick(10)}
                disabled={goal >= 400}
              >
                <Plus />
              </Button>
            </div>
          </div>
          <DrawerFooter>
            <Button>Submit</Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
```

### Component: Dialog
**Dependencies:** @radix-ui/react-dialog
**Key Props:** open, onOpenChange, modal

### Component: AlertDialog
**Dependencies:** @radix-ui/react-alert-dialog
**Key Props:** open, onOpenChange, used for destructive actions

### Component: Tabs
**Dependencies:** @radix-ui/react-tabs
**Key Props:** value, onValueChange, orientation

### Component: Switch
**Dependencies:** @radix-ui/react-switch
**Key Props:** checked, onCheckedChange, disabled

### Component: Slider
**Dependencies:** @radix-ui/react-slider
**Key Props:** defaultValue, max, min, step, className
**Best Example:**
```tsx
export default function SliderDemo({ className, ...props }: SliderProps) {
  return (
    <Slider
      defaultValue={[50]}
      max={100}
      step={1}
      className={cn("w-[60%]", className)}
      {...props}
    />
  )
}
```

## Data Display Components

### Component: Calendar
**Dependencies:** react-day-picker@latest, date-fns
**Key Props:** mode (single, multiple, range), selected, onSelect, disabled

### Component: Popover
**Dependencies:** @radix-ui/react-popover
**Key Props:** open, onOpenChange, side, align

### Component: Skeleton
**Dependencies:** None
**Key Props:** className for sizing and animation

## Chart and Visualization Components

### Component: Chart
**Dependencies:** recharts@2.15.4, lucide-react
**Key Props:** ChartContainer, ChartConfig, ChartTooltip, ChartLegend
**Best Example:**
```tsx
const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
]

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "#2563eb",
  },
  mobile: {
    label: "Mobile",
    color: "#60a5fa",
  },
} satisfies ChartConfig

export default function Component() {
  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
        <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
```

### Chart Variations Available:
- **Bar Charts**: Basic, with axis, with grid, with legend, with tooltip
- **Pie Charts**: Donut, with text, with active sectors
- **Line Charts**: Basic, with dots, stepped
- **Area Charts**: Stacked, stepped, with icons
- **Radar Charts**: With dots, with icons, customizable radius

## Interactive Dashboard Components

### Component: DataTable
**Dependencies:** @tanstack/react-table
**Key Props:** columns, data, sorting, filtering, pagination
**Best Example:** Complete data table with sorting, filtering, and actions:
```tsx
export default function DataTableDemo() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter emails..."
          value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("email")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-muted-foreground flex-1 text-sm">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
```

### Component: HoverCard
**Dependencies:** @radix-ui/react-hover-card
**Key Props:** openDelay, closeDelay, side, align

### Component: Command
**Dependencies:** cmdk
**Key Props:** value, onValueChange, filter, loop
**Best Example:**
```tsx
export default function CommandDemo() {
  return (
    <Command className="rounded-lg border shadow-md md:min-w-[450px]">
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem>
            <Calendar />
            <span>Calendar</span>
          </CommandItem>
          <CommandItem>
            <Smile />
            <span>Search Emoji</span>
          </CommandItem>
          <CommandItem disabled>
            <Calculator />
            <span>Calculator</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem>
            <User />
            <span>Profile</span>
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <CreditCard />
            <span>Billing</span>
            <CommandShortcut>⌘B</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <Settings />
            <span>Settings</span>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  )
}
```

### Component: DropdownMenu
**Dependencies:** @radix-ui/react-dropdown-menu
**Key Props:** open, onOpenChange, modal

### Component: Sheet
**Dependencies:** @radix-ui/react-dialog
**Key Props:** open, onOpenChange, side (top, right, bottom, left)

## Layout and Navigation Components

### Component: Accordion
**Dependencies:** @radix-ui/react-accordion
**Key Props:** type (single, multiple), collapsible, value, onValueChange

### Component: Resizable
**Dependencies:** react-resizable-panels
**Key Props:** direction (horizontal, vertical), sizes, onSizesChange

### Component: ScrollArea
**Dependencies:** @radix-ui/react-scroll-area
**Key Props:** orientation (vertical, horizontal, both), scrollHideDelay

### Component: ToggleGroup
**Dependencies:** @radix-ui/react-toggle-group
**Key Props:** type (single, multiple), value, onValueChange, variant, size

### Component: Alert
**Dependencies:** None
**Key Props:** variant (default, destructive), className

## Implementation Recommendations for Trading UI

### Form Architecture Strategy:
1. **Use Card containers** for each form section (Entry, Risk, Exit, Analysis)
2. **Implement Form with Zod validation** for real-time feedback
3. **Progress component** for completion tracking
4. **Drawer component** for mobile-responsive forms
5. **Tooltip components** for field help and validation hints

### Dashboard Enhancement Strategy:
1. **Chart components** for all visualizations (P&L, performance metrics)
2. **DataTable component** for enhanced trade tables with sorting/filtering
3. **Command component** for global search and navigation
4. **Sheet components** for side panels and quick actions
5. **HoverCard components** for contextual trade details

### Trading-Specific Component Applications:

#### Trade Entry Form:
- **Card + Form + Tabs**: Multi-step form structure
- **Select components**: Market selection, direction, strategy
- **Input components**: Prices, quantities, risk parameters
- **Slider component**: Risk percentage adjustment
- **Progress component**: Form completion indicator
- **Tooltip components**: Field explanations and validations

#### Trading Dashboard:
- **Chart components**:
  - Bar charts for P&L analysis
  - Pie charts for win/loss ratios and strategy allocation
  - Line charts for equity curves
  - Area charts for cumulative returns
- **DataTable component**: Enhanced trade history with filtering
- **Command component**: Quick search and navigation
- **Accordion component**: Collapsible metric sections
- **ToggleGroup component**: Time period selectors

#### Mobile Optimizations:
- **Drawer components**: Mobile-first form panels
- **Sheet components**: Slide-out navigation and actions
- **ScrollArea components**: Optimized scrolling for data tables
- **Resizable components**: Adaptive layout for different screen sizes

## Next Steps for Implementation:

1. **Install all components** using the provided command
2. **Start with form components** - replace existing EnhancedTradeForm sections
3. **Implement chart components** for dashboard visualizations
4. **Add interactive components** for enhanced user experience
5. **Test mobile responsiveness** with Drawer and Sheet components

---
**Research Completed**: All 30 required components analyzed and documented
**Implementation Ready**: Components can be incrementally integrated into existing codebase