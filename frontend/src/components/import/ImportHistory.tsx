import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  Download,
  Trash2,
  Eye,
  Calendar,
  BarChart3,
  TrendingUp,
  RefreshCw,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useImportStore } from '@/store/importStore';
import { importService } from '@/services/importService';
import type { ImportSession } from '@/types/import';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

export function ImportHistory() {
  const {
    sessions,
    stats,
    setSessions,
    setStats,
    removeSession,
  } = useImportStore();

  const [isLoading, setIsLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ImportSession | null>(null);
  const [filter, setFilter] = useState<'all' | 'completed' | 'failed' | 'pending'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadHistory();
    loadStats();
  }, []);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const sessions = await importService.getImportSessions();
      setSessions(sessions);
    } catch (error: any) {
      toast.error('Failed to load import history');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const stats = await importService.getImportStats();
      setStats(stats);
    } catch (error: any) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await importService.deleteImportSession(sessionId);
      removeSession(sessionId);
      toast.success('Import session deleted');
    } catch (error: any) {
      toast.error('Failed to delete session');
    }
  };

  const handleDownloadSession = async (sessionId: string) => {
    try {
      await importService.downloadSessionData(sessionId);
      toast.success('Download started');
    } catch (error: any) {
      toast.error('Failed to download session data');
    }
  };

  const getStatusIcon = (status: ImportSession['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: ImportSession['status']) => {
    const variants = {
      completed: 'default',
      failed: 'destructive',
      processing: 'secondary',
      pending: 'outline',
    } as const;

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredSessions = sessions.filter(session => {
    const matchesFilter = filter === 'all' || session.status === filter;
    const matchesSearch = searchTerm === '' ||
      session.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.id.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const statsCards = [
    {
      title: 'Total Imports',
      value: stats?.totalSessions || 0,
      icon: FileText,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Successful',
      value: stats?.successfulImports || 0,
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Failed',
      value: stats?.failedImports || 0,
      icon: AlertCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Trades Imported',
      value: stats?.totalTradesImported || 0,
      icon: TrendingUp,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Import History</h2>
          <p className="text-muted-foreground">
            View and manage your trading data imports
          </p>
        </div>
        <Button onClick={loadHistory} disabled={isLoading}>
          <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={cn('p-2 rounded-lg', stat.bgColor)}>
                    <stat.icon className={cn('h-5 w-5', stat.color)} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sessions</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Input
                placeholder="Search by filename or session ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Import Sessions List */}
      <Card>
        <CardHeader>
          <CardTitle>Import Sessions ({filteredSessions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || filter !== 'all'
                  ? 'No sessions match your filters'
                  : 'No import sessions found'
                }
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-96">
              <div className="space-y-4">
                <AnimatePresence>
                  {filteredSessions.map((session, index) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 flex-1">
                              <div className="flex items-center space-x-2">
                                {getStatusIcon(session.status)}
                                <div>
                                  <p className="font-medium">{session.fileName}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {importService.formatFileSize(session.fileSize)}
                                  </p>
                                </div>
                              </div>

                              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <p className="font-medium">{session.importedRecords}</p>
                                  <p className="text-muted-foreground">Imported</p>
                                </div>
                                <div>
                                  <p className="font-medium">{session.skippedRecords}</p>
                                  <p className="text-muted-foreground">Skipped</p>
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {format(new Date(session.uploadedAt), 'MM/dd/yyyy')}
                                  </p>
                                  <p className="text-muted-foreground">
                                    {formatDistanceToNow(new Date(session.uploadedAt), { addSuffix: true })}
                                  </p>
                                </div>
                                <div>
                                  {getStatusBadge(session.status)}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedSession(session)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Import Session Details</DialogTitle>
                                  </DialogHeader>
                                  {selectedSession && (
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <p className="text-sm font-medium">File Name</p>
                                          <p className="text-sm text-muted-foreground">
                                            {selectedSession.fileName}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium">Status</p>
                                          {getStatusBadge(selectedSession.status)}
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium">Uploaded</p>
                                          <p className="text-sm text-muted-foreground">
                                            {format(new Date(selectedSession.uploadedAt), 'PPpp')}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium">Processed</p>
                                          <p className="text-sm text-muted-foreground">
                                            {selectedSession.processedAt
                                              ? format(new Date(selectedSession.processedAt), 'PPpp')
                                              : 'Not yet processed'
                                            }
                                          </p>
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-3 gap-4 text-center">
                                        <div>
                                          <p className="text-2xl font-bold text-blue-600">
                                            {selectedSession.totalRecords}
                                          </p>
                                          <p className="text-sm text-muted-foreground">Total Records</p>
                                        </div>
                                        <div>
                                          <p className="text-2xl font-bold text-green-600">
                                            {selectedSession.importedRecords}
                                          </p>
                                          <p className="text-sm text-muted-foreground">Imported</p>
                                        </div>
                                        <div>
                                          <p className="text-2xl font-bold text-yellow-600">
                                            {selectedSession.skippedRecords}
                                          </p>
                                          <p className="text-sm text-muted-foreground">Skipped</p>
                                        </div>
                                      </div>

                                      {selectedSession.errors.length > 0 && (
                                        <div>
                                          <p className="text-sm font-medium mb-2">Errors</p>
                                          <ScrollArea className="h-32 w-full border rounded p-2">
                                            <div className="space-y-1">
                                              {selectedSession.errors.map((error, index) => (
                                                <p key={index} className="text-sm text-red-600">
                                                  Row {error.row}: {error.message}
                                                </p>
                                              ))}
                                            </div>
                                          </ScrollArea>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>

                              {session.status === 'completed' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDownloadSession(session.id)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              )}

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSession(session.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}