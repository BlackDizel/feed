from django.urls import include, path
from rest_framework import routers
from feeder.views import sync, feed, statistic, color, volunteer, kitchen, group_badge, direction, gender, person, photo, staying, transport
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

router = routers.DefaultRouter()
router.register(r'directions', direction.DirectionViewSet)
router.register(r'volunteers', volunteer.VolunteerViewSet)
router.register(r'colors', color.ColorViewSet)
router.register(r'feed-types', feed.FeedTypeViewSet)
router.register(r'feed-transaction', feed.FeedTransactionViewSet)
router.register(r'kitchens', kitchen.KitchenViewSet)
router.register(r'group-badges', group_badge.GroupBadgeViewSet)
router.register(r'volunteer-custom-fields', volunteer.VolunteerCustomFieldViewSet)
router.register(r'volunteer-custom-field-values', volunteer.VolunteerCustomFieldValueViewSet)
router.register(r'genders', gender.GenderViewSet)
router.register(r'persons', person.PersonViewSet)
router.register(r'photos', photo.PhotoViewSet)
router.register(r'staying', staying.StayingViewSet)
router.register(r'transports', transport.TransportViewSet)

urlpatterns = [
    path('', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('schema/', SpectacularAPIView.as_view(), name='schema'),
    path('redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    path('auth/', include('dj_rest_auth.urls')),

    path('', include(router.urls)),
    path('feed-transaction/bulk', feed.FeedTransactionBulk.as_view()),
    path('feed-transaction/sync', sync.SyncWithFeeder.as_view()),
    path('statistics/', statistic.Statistics.as_view()),
    path('notion-sync', sync.SyncWithNotion.as_view()),
]

