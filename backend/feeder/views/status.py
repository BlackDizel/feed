from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend

from feeder import serializers, models


class StatusViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, ]
    queryset = models.Status.objects.all()
    serializer_class = serializers.StatusSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', ]
