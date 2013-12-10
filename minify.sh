echo "=======================Combining======================="

ver="1.0"
thedate=$(date)
type=""
format="String.Format"

cat src/copyright.txt src/utils/getterSetter.js src/utils/http/httpModule.js src/utils/http/logger.js src/utils/http/urlFactory.js src/promise.js src/EventManager.js src/config.js src/request.js src/session.js src/filter.js src/queries.js src/baseObject.js src/guid.js src/article.js src/connection.js src/Users.js src/facebook.js src/email.js src/push.js src/file.js src/date.js src/localstorage.js src/cookie.js src/cloud.js src/export.js | sed "s/\${ver}/$ver/g;s/\${time}/$thedate/g;s/\${type}/$type/g" > AppacitiveSDK.js

echo "Done combining AppacitiveSDK.js"

echo "================Minifying AppacitiveSDK.js============="

in=AppacitiveSDK.js
out=AppacitiveSDK.min.js

java -jar /usr/local/lib/compiler.jar --js $in --js_output_file $out

echo "============Minified AppacitiveSDK.min.js=============="