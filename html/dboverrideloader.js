"use strict";
class DbOverrideloader {
    constructor() {
        this.db = {
            request_count: 0,
            request_queue: [],
            request_cache: {}
        };
    }
    dbLoad(icao) {
        let defer = new UnwrappedPromise();
        if (icao[0] == '~') {
            defer.resolve(null);
            return defer;
        }
        icao = icao.toUpperCase();
        this.request_from_db(icao, 1, defer);
        return defer;
    }
    request_from_db(icao, level, defer) {
        let bkey = icao.substring(0, level);
        let dkey = icao.substring(level);
        let req = this.db_ajax(bkey);
        req.then(data => {
            if (data == null) {
                defer.resolve("strange");
                return;
            }
            if (dkey in data) {
                defer.resolve(data[dkey]);
                return;
            }
            defer.resolve(null);
        }, error => {
            defer.reject(error);
        });
    }
    db_ajax(bkey) {
        let req;
        if (bkey in this.db.request_cache) {
            return this.db.request_cache[bkey];
        }
        req = this.db.request_cache[bkey] = new DbRequest(bkey);
        // put it in the queue
        this.db.request_queue.push(req);
        this.db_ajax_request_complete();
        return req;
    }
    db_ajax_request_complete() {
        let req;
        let ajaxreq;
        if (this.db.request_queue.length == 0 || this.db.request_count >= 1) {
            return;
        }
        else {
            this.db.request_count++;
            // @ts-ignore
            req = this.db.request_queue.shift();
            const req_url = 'db-overrides/' + req.bkey + '.js';
            ajaxreq = jQuery.ajax({ url: req_url,
                cache: true,
                timeout: 30000,
                dataType: 'json' });
            ajaxreq.done(data => {
                req.resolve(data);
            });
            ajaxreq.fail((jqxhr, status, error) => {
                if (status == 'timeout') {
                    delete this.db.request_cache[req.bkey];
                }
                let reason = new Error('');
                if (status == 'timeout') {
                    // @ts-ignore
                    reason.http_status = 'timeout';
                    console.error('Database: HTTP error: timeout (URL: ' + req_url + ')');
                }
                else {
                    console.error('Database: HTTP error: ' + jqxhr.status + ' (URL: ' + req_url + ')');
                    // @ts-ignore
                    reason.http_status = 'other';
                }
                req.reject(reason);
            });
            ajaxreq.always(() => {
                this.db.request_count--;
                this.db_ajax_request_complete();
            });
        }
    }
}
class UnwrappedPromise {
    constructor() {
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }
    then(onfulfilled, onrejected) {
        return this.promise.then(onfulfilled, onrejected);
    }
    catch(onrejected) {
        return this.promise.catch(onrejected);
    }
}
class DbRequest extends UnwrappedPromise {
    constructor(bkey) {
        super();
        this.bkey = bkey;
    }
}
window.dbOverrides = new DbOverrideloader();
