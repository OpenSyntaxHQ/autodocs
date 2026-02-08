import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from '@/components/ui/table';
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

function renderBasics() {
  return render(
    <div>
      <Input placeholder="Email" />
      <Separator />
      <Skeleton />

      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Card title</CardTitle>
          <CardDescription>Card description</CardDescription>
          <CardAction>Action</CardAction>
        </CardHeader>
        <CardContent>Card content</CardContent>
        <CardFooter>Card footer</CardFooter>
      </Card>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Col</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Val</TableCell>
          </TableRow>
        </TableBody>
        <TableCaption>Caption</TableCaption>
      </Table>

      <Command>
        <CommandInput placeholder="Search" />
        <CommandList>
          <CommandEmpty>No results</CommandEmpty>
          <CommandGroup heading="Group">
            <CommandItem>Item</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>

      <CommandDialog open>
        <CommandInput placeholder="Search" />
        <CommandList>
          <CommandGroup heading="Docs">
            <CommandItem>Entry</CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}

describe('ui primitives', () => {
  it('renders base UI elements with data-slot hooks', () => {
    const { container } = renderBasics();

    expect(container.querySelector('[data-slot="input"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="separator"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="skeleton"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="tabs"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="tabs-list"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="tabs-trigger"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="tabs-content"]')).toBeInTheDocument();

    expect(container.querySelector('[data-slot="card"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="card-header"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="card-title"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="card-description"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="card-content"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="card-footer"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="card-action"]')).toBeInTheDocument();

    expect(container.querySelector('[data-slot="table-container"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="table"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="table-header"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="table-body"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="table-row"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="table-head"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="table-cell"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="table-caption"]')).toBeInTheDocument();

    expect(container.querySelector('[data-slot="command"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="command-input"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="command-list"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="command-group"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="command-item"]')).toBeInTheDocument();
  });

  it('respects dialog/sheet close button flags', () => {
    const { queryByText, getAllByText, rerender } = render(
      <Dialog open>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription>Description</DialogDescription>
          </DialogHeader>
          <DialogFooter>Footer</DialogFooter>
        </DialogContent>
      </Dialog>
    );

    expect(queryByText('Close')).not.toBeInTheDocument();

    rerender(
      <Sheet open>
        <SheetContent showCloseButton>
          <SheetHeader>
            <SheetTitle>Title</SheetTitle>
            <SheetDescription>Description</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    );

    expect(getAllByText('Close').length).toBeGreaterThan(0);
  });
});
