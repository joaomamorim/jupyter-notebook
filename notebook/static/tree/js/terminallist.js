// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

define([
    'base/js/namespace',
    'base/js/utils',
    'tree/js/notebooklist',
], function(IPython, utils, notebooklist) {
    "use strict";

    var TerminalList = function (selector, options) {
        /**
         * Constructor
         *
         * Parameters:
         *  selector: string
         *  options: dictionary
         *      Dictionary of keyword arguments.
         *          base_url: string
         */
        this.base_url = options.base_url || utils.get_body_data("baseUrl");
        this.element_name = options.element_name || 'running';
        this.selector = selector;
        this.terminals = [];
        if (this.selector !== undefined) {
            this.element = $(selector);
            this.style();
            this.bind_events();
            this.load_terminals();
        }
    };

    TerminalList.prototype = Object.create(notebooklist.NotebookList.prototype);

    TerminalList.prototype.bind_events = function () {
        var that = this;
        $('#refresh_' + this.element_name + '_list').click(function () {
            that.load_terminals();
        });
        $('#new-terminal').click($.proxy(this.new_terminal, this));
    };

    TerminalList.prototype.new_terminal = function () {
        var w = window.open(undefined, IPython._target);
        var settings = {
            type : "POST",
            dataType: "json",
            success : function (data, status, xhr) {
                var name = data.name;
        var terminal_link_path;
        // Production fix
        if (window.location.hostname.includes("datascience.com")) {
            var terminal_link_base_path = utils.url_path_join(
                "notebooks",
                "tree",
                "terminals",
                utils.encode_uri_components(name)
            );
            terminal_link_path =
                "https://" + window.location.hostname + "/" + terminal_link_base_path;
        }
        else {
            // defaults to behavior for testing locally
            var hardcoded_spawner_port = "8282";
            var terminal_link_base_path = utils.url_path_join(
                "notebooks",
                "tree",
                "terminals",
                utils.encode_uri_components(name)
            );
            terminal_link_path =
                "http://" + window.location.hostname + ":" + hardcoded_spawner_port +  "/" +
                  terminal_link_base_path;
        }


                w.location = terminal_link_path;
            },
            error : function(jqXHR, status, error){
                w.close();
                utils.log_ajax_error(jqXHR, status, error);
            },
        };
        var url = utils.url_path_join(
            this.base_url,
            'api/terminals'
        );
        $.ajax(url, settings);
    };
    
    TerminalList.prototype.load_terminals = function() {
        var url = utils.url_path_join(this.base_url, 'api/terminals');
        $.ajax(url, {
            type: "GET",
            cache: false,
            dataType: "json",
            success: $.proxy(this.terminals_loaded, this),
            error : utils.log_ajax_error
        });
    };

    TerminalList.prototype.terminals_loaded = function (data) {
        this.terminals = data;
        this.clear_list();
        var item, term;
        for (var i=0; i < this.terminals.length; i++) {
            term = this.terminals[i];
            item = this.new_item(-1);
            this.add_link(term.name, item);
            this.add_shutdown_button(term.name, item);
        }
        $('#terminal_list_header').toggle(data.length === 0);
    };
    
    TerminalList.prototype.add_link = function(name, item) {
        item.data('term-name', name);
        item.find(".item_name").text("terminals/" + name);
        item.find(".item_icon").addClass("fa fa-terminal");
        var link = item.find("a.item_link")
            .attr('href', utils.url_path_join(this.base_url, "terminals",
                                              utils.encode_uri_components(name)));


        link.attr('target', IPython._target||'_blank');
        this.add_shutdown_button(name, item);
    };
    
    TerminalList.prototype.add_shutdown_button = function(name, item) {
        var that = this;
        var shutdown_button = $("<button/>").text("Shutdown").addClass("btn btn-xs btn-warning").
            click(function (e) {
                var settings = {
                    processData : false,
                    type : "DELETE",
                    dataType : "json",
                    success : function () {
                        that.load_terminals();
                    },
                    error : utils.log_ajax_error,
                };
                var url = utils.url_path_join(that.base_url, 'api/terminals',
                    utils.encode_uri_components(name));
                $.ajax(url, settings);
                return false;
            });
        item.find(".item_buttons").text("").append(shutdown_button);
    };

    return {TerminalList: TerminalList};
});
